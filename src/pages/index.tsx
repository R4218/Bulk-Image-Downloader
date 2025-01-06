import JSZip from "jszip";
import Head from "next/head";
import Image from "next/image";
import { useState } from "react";

export default function Home() {
  const [url, setUrl] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [visibleImages, setVisibleImages] = useState(16);
  const [isProcessing, setIsProcessing] = useState(false);
  const [popupMessage, setPopupMessage] = useState<string | null>(null);

  const fetchImages = async () => {
    setError(null);
    try {
      const res = await fetch("/api/fetch-images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (res.ok) {
        setImages(data.imageUrls);
      } else {
        setError(data.error);
      }
    } catch {
      setError("An error occurred while fetching images.");
    }
  };

  const handleDownload = async () => {
    setIsProcessing(true);
    setPopupMessage("Preparing images for download...");

    const zip = new JSZip();
    const imgFolder = zip.folder("images");
    if (!imgFolder) {
      setIsProcessing(false);
      return;
    }

    try {
      const promises = selectedImages.map(async (imgUrl) => {
        const response = await fetch(
          `/api/fetch-images?imgUrl=${encodeURIComponent(imgUrl)}`
        );
        if (!response.ok) {
          throw new Error(`Failed to fetch ${imgUrl}`);
        }
        const blob = await response.blob();
        imgFolder.file(imgUrl.split("/").pop() || "image.jpg", blob);
      });

      await Promise.all(promises);
      const zipBlob = await zip.generateAsync({ type: "blob" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(zipBlob);
      link.download = "images.zip";
      link.click();
      setPopupMessage("Download started successfully!");

      setTimeout(() => {
        setPopupMessage(null);
      }, 3000);
    } catch {
      setError(
        "An error occurred while downloading the images. Some URLs may be blocked."
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleIndividualDownload = async (imgUrl: string) => {
    try {
      const response = await fetch(
        `/api/fetch-images?imgUrl=${encodeURIComponent(imgUrl)}`
      );
      if (!response.ok) {
        throw new Error(`Failed to fetch ${imgUrl}`);
      }
      const blob = await response.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = imgUrl.split("/").pop() || "image.jpg";
      link.click();
    } catch {
      setError("Failed to download the image.");
    }
  };

  const toggleImageSelection = (imgUrl: string) => {
    setSelectedImages((prev) =>
      prev.includes(imgUrl)
        ? prev.filter((url) => url !== imgUrl)
        : [...prev, imgUrl]
    );
  };

  const toggleSelectAll = () => {
    if (selectedImages.length === images.length) {
      setSelectedImages([]);
    } else {
      setSelectedImages(images);
    }
  };

  const loadMoreImages = () => {
    setVisibleImages((prev) => prev + 16);
  };

  return (
    <>
      <Head>
        <title>Bulk Image Downloader | WebVives</title>
        <meta
          name="description"
          content="Download images in bulk from any URL with ease."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta
          name="keywords"
          content="bulk image downloader, image download tool, download images, zip images"
        />
        <meta name="author" content="WebVives" />
        <meta name="robots" content="index, follow" />
        <meta property="og:title" content="Bulk Image Downloader" />
        <meta
          property="og:description"
          content="Download images in bulk from any URL with ease."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://webvives.com/" />
        <meta property="og:image" content="/social-image.jpg" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="min-h-screen flex flex-col items-center bg-gray-100">
        {isProcessing && (
          <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white p-4 rounded shadow-md text-center">
              <div className="animate-spin h-8 w-8 border-4 border-green-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-green-600">{popupMessage}</p>
            </div>
          </div>
        )}
        <header className="bg-green-500 w-full py-4 text-center text-white text-xl">
          <h1>Bulk Image Downloader</h1>
        </header>
        <main className="flex-1 w-full max-w-4xl p-4">
          <div className="mb-4">
            <input
              type="url"
              placeholder="Enter a URL"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full p-2 border rounded focus:outline-none focus:border-green-500 transition duration-300 ease-in-out text-black"
            />
            <button
              onClick={fetchImages}
              className="mt-2 w-full bg-green-500 text-white p-2 rounded"
            >
              Fetch Images
            </button>
          </div>
          {error && <p className="text-red-500">{error}</p>}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {images.slice(0, visibleImages).map((img, idx) => (
              <div key={idx} className="relative group">
                <Image
                  src={img}
                  alt="Fetched"
                  width={128}
                  height={128}
                  className="w-full h-32 object-cover"
                />

                <button
                  onClick={() => handleIndividualDownload(img)}
                  className="absolute top-2 right-2 bg-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-green-500"
                    fill="currentColor"
                    viewBox="0 0 128 128"
                  >
                    <path d="M64.1 87.9L94.9 57.2l-3.9-3.8L66.7 77.7V21.3h-5.3v56.4L37.1 53.4l-3.8 3.8 30.8 30.7zm0-87.9C28.8 0 .2 28.7.2 64s28.6 64 63.9 64S128 99.3 128 64c-.1-35.3-28.7-64-63.9-64zm0 122.7C31.7 122.7 5.5 96.4 5.5 64c0-32.4 26.2-58.7 58.6-58.7s58.6 26.3 58.6 58.7c-.1 32.4-26.3 58.7-58.6 58.7zm-34.6-24h69.2v-5.3H29.5v5.3z" />
                  </svg>
                </button>

                <input
                  type="checkbox"
                  checked={selectedImages.includes(img)}
                  onChange={() => toggleImageSelection(img)}
                  className="absolute top-2 left-2 w-4 h-4 accent-green-300 focus:accent-green-500"
                />
              </div>
            ))}
          </div>
          {images.length > visibleImages && (
            <div className="mt-4 text-center">
              <button
                onClick={loadMoreImages}
                className="bg-gray-500 text-white p-2 rounded"
              >
                Load More
              </button>
            </div>
          )}
          {images.length > 0 && (
            <div className="mt-4 flex justify-between">
              <button
                onClick={toggleSelectAll}
                className="bg-gray-500 text-white p-2 rounded"
              >
                {selectedImages.length === images.length
                  ? "Deselect All"
                  : "Select All"}
              </button>
              <button
                onClick={handleDownload}
                className="bg-green-500 text-white p-2 rounded"
              >
                Download Selected Images
              </button>
            </div>
          )}
        </main>
        <footer className="bg-green-500 w-full py-4 mt-14 text-center text-white text-sm">
          © 2024 Bulk Image Downloader. All rights reserved. Powered by{" "}
          <a
            href="https://webvives.com"
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold"
          >
            WebVives
          </a>
          .
        </footer>
      </div>
    </>
  );
}
