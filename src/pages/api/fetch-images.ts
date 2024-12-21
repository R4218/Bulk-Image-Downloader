import * as cheerio from "cheerio";
import type { NextApiRequest, NextApiResponse } from "next";
import fetch from "node-fetch";

interface FetchImagesResponse {
  imageUrls?: string[];
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<FetchImagesResponse>
) {
  if (req.method === "POST") {
    const { url } = req.body;
    try {
      const response = await fetch(url);
      const html = await response.text();
      const $ = cheerio.load(html);
      const imageUrls: string[] = [];

      $("img").each((_, img) => {
        let src = $(img).attr("src");
        if (src && !src.startsWith("http")) {
          const baseUrl = new URL(url);
          src = new URL(src, baseUrl.origin).href; // Resolve relative URLs
        }
        if (src) imageUrls.push(src);
      });

      res.status(200).json({ imageUrls });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch images from the URL." });
    }
  } else if (req.method === "GET") {
    const { imgUrl } = req.query;

    if (!imgUrl || typeof imgUrl !== "string") {
      return res.status(400).json({ error: "Invalid image URL." });
    }

    try {
      const response = await fetch(imgUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${imgUrl}`);
      }

      const buffer = await response.arrayBuffer();
      res.setHeader(
        "Content-Type",
        response.headers.get("Content-Type") || "application/octet-stream"
      );
      res.send(Buffer.from(buffer));
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to fetch image binary." });
    }
  } else {
    res.setHeader("Allow", ["POST", "GET"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
