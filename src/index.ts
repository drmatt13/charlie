import express, { Request, Response } from "express";
import { exiftool } from "exiftool-vendored";
import * as fs from "fs";
import * as path from "path";

const app = express();
const photoDir: string = "/app/photos";
const selectedImages: string[] = [];
let lastAction: { key: string; images: string[] } | null = null;

// Predefined EXIF tags for keys
const exifTags: { [key: string]: { tag: string; value: string } } = {
  a: { tag: "Label", value: "Tag1" },
  s: { tag: "Label", value: "Tag2" },
  d: { tag: "Label", value: "Tag3" },
  f: { tag: "Label", value: "Tag4" },
  j: { tag: "Label", value: "Tag5" },
  k: { tag: "Label", value: "Tag6" },
  l: { tag: "Label", value: "Tag7" },
  ";": { tag: "Label", value: "Tag8" },
};

// Function to apply EXIF tags
async function applyExifTag(key: string, imagePath: string) {
  const { tag, value } = exifTags[key];
  await exiftool.write(imagePath, { [tag]: value });
  console.log(`Applied tag "${tag}: ${value}" to ${imagePath}`);
}

// Function to undo last action
async function undoLastAction() {
  if (!lastAction) {
    console.log("Nothing to undo");
    return;
  }

  const { key, images } = lastAction;
  for (const image of images) {
    const { tag } = exifTags[key];
    // Remove the EXIF tag by setting it to an empty value
    await exiftool.write(image, { [tag]: "" });
    console.log(`Removed tag "${tag}" from ${image}`);
  }

  lastAction = null;
}

// Function to process keypresses
async function handleKeypress(key: string) {
  if (key === "z") {
    // Undo key
    await undoLastAction();
  } else if (key === " ") {
    // Spacebar: Select more images
    const nextImage = getNextImage();
    if (nextImage) {
      selectedImages.push(nextImage);
      console.log(`Selected image: ${nextImage}`);
    }
  } else if (exifTags[key]) {
    // One of the sorting keys: Apply EXIF tags
    if (selectedImages.length > 0) {
      lastAction = { key, images: [...selectedImages] }; // Store last action for undo
      for (const image of selectedImages) {
        await applyExifTag(key, image);
      }
      selectedImages.length = 0; // Clear selection after tagging
    }
  }
}

// Mock function to get the next image from the stack
function getNextImage(): string | null {
  const files = fs
    .readdirSync(photoDir)
    .map((file) => path.join(photoDir, file));
  const nextFile = files[selectedImages.length]; // Example of selecting next file
  return nextFile ? nextFile : null;
}

// Serve an HTML page for viewing images
app.get("/thumbnails", async (req: Request, res: Response) => {
  const imagePaths = fs
    .readdirSync(photoDir)
    .map((file) => path.join(photoDir, file));
  let html = "<table><tr>";

  imagePaths.forEach((imagePath, index) => {
    const base64Thumbnail = fs.readFileSync(imagePath).toString("base64"); // Convert to base64 for display
    html += `
      <td>
        <img src="data:image/png;base64,${base64Thumbnail}" width="128" height="128"/>
      </td>
    `;
    if ((index + 1) % 4 === 0) {
      html += "</tr><tr>";
    }
  });

  html += "</tr></table>";
  res.send(html);
});

// Handle keypress route
app.post("/keypress", async (req: Request, res: Response) => {
  const key = req.query.key as string;
  await handleKeypress(key);
  res.sendStatus(200);
});

// Start the server
app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
