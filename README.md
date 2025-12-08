# Banafit AI Studio

**Banafit AI Studio** is a professional-grade AI workflow tool designed specifically for fashion e-commerce and creative studios. Unlike simple "text-to-image" generators, Banafit focuses on an iterative **Workflow** approach: Uploading a base product image, stacking condition layers (prompts), generating variations, and refining results through specific adjustments.

Powered by **Google Gemini 2.5 Flash Image**, it offers high-speed, high-fidelity image manipulation.

---

## 🚀 Key Features

*   **Workflow-Based UX**: Structured steps from upload to export, mirroring professional photo editing processes.
*   **Prompt Layers**: a unique system to stack "System", "User", and "Custom" prompts to build complex generation logic incrementally.
*   **Batch Generation**: Generate 1, 3, or 5 variations simultaneously.
*   **Iterative Refinement**: Select a generated result and apply further AI edits (Inpainting/Variation) without losing context.
*   **Context Retention**: Maintains the visual identity of the input product while changing models or backgrounds.

---

## 📚 User Flow & Step-by-Step Guide

The application operates as a linear state machine with 6 distinct steps. Below is a detailed breakdown of each page.

### 1. Step: Upload (Input Stage)
**Goal**: Ingest the source material (Product photography).

*   **UI Elements**:
    *   Large Drag & Drop zone.
    *   File input handler supporting JPG/PNG (Max 10MB).
    *   Thumbnail grid for multiple uploads.
*   **User Flow**:
    1.  User drags a mannequin shot or flat-lay product photo into the drop zone.
    2.  The app converts images to Base64 and generates local preview URLs.
    3.  User selects the specific "Active Input" image to be processed (marked with a checkmark).
    4.  Click "Next Step".

### 2. Step: Conditions (Configuration)
**Goal**: Define the scope of the generation job.

*   **UI Elements**:
    *   **Output Quantity**: Selector for 1, 3, or 5 images.
    *   **Generation Type**:
        *   *Model Change*: Keeps clothing, swaps the model/human subject.
        *   *Virtual Try-On*: Fits clothing onto a generated model.
        *   *Ghost Mannequin*: Cleans up product shots for catalogs.
*   **User Flow**:
    1.  User determines they need 3 variations of "Model Change".
    2.  State is updated to reflect this configuration.
    3.  Click "Next Step".

### 3. Step: Prompts (Layering System)
**Goal**: Construct the prompt logically rather than writing one giant paragraph.

*   **UI Elements**:
    *   **Left Panel**: Sticky preview of the original input image for reference.
    *   **Right Panel**: Stackable Prompt Layers.
*   **The Layer Concept**:
    *   **System Layer (Locked)**: Enforces quality (e.g., "8k resolution, photorealistic"). User cannot remove this.
    *   **User Layer (Default)**: Common settings like "Female Model", "Studio Lighting".
    *   **Custom Layer**: User clicks "+ Add Layer" to input specific requests (e.g., "Standing on a beach", "Wearing sunglasses").
*   **User Flow**:
    1.  User toggles specific layers ON or OFF.
    2.  User adds a custom layer for specific creative direction.
    3.  The app aggregates enabled layers into a single prompt string under the hood.
    4.  Click "Generate Images".

### 4. Step: Generation (Processing)
**Goal**: Interact with Gemini API and display results.

*   **UI Elements**:
    *   **Input Thumbnails**: Reference to the original.
    *   **Result Grid**: Displays generated images.
    *   **Actions**: "Adjust/Edit" or "Select" buttons on hover.
*   **Technical Flow**:
    1.  App calls `generateBatchImages`.
    2.  Requests are sent in parallel to `gemini-2.5-flash-image`.
    3.  Loading spinners appear (`Loader2`).
    4.  On success, images are rendered.
*   **User Flow**:
    1.  User reviews the grid.
    2.  If unsatisfied, clicks "Generate More".
    3.  If a specific image has potential but needs fixing, they click **"Adjust / Edit"**.

### 5. Step: Adjust (Refinement Engine)
**Goal**: Fine-tune a specific result without starting over. This is the most powerful feature.

*   **UI Elements**:
    *   **Main Canvas**: Large view of the selected image.
    *   **AI Text Edit**: A text box to request specific changes to *that* image.
    *   **History Strip**: Thumbnails of previous iterations to allow undo/branching.
*   **User Flow**:
    1.  User sees a generated image where the lighting is too dark.
    2.  Types "Make the lighting warmer and softer" into the AI Text Edit box.
    3.  Click "Apply Edit".
    4.  The app sends the *generated image* back to Gemini as the input, along with the modification prompt.
    5.  A new version appears and is added to the history.
    6.  User clicks "Select" to finalize.

### 6. Step: Final (Export)
**Goal**: delivery of assets.

*   **UI Elements**:
    *   High-resolution preview.
    *   Download buttons (PNG).
    *   "Start New Project" reset.
*   **User Flow**:
    1.  User downloads the high-quality PNG.
    2.  User loops back to the start for the next SKU.

---

## 🧠 Deep Dive: How Prompt Layers Work

The "Prompt Layer" feature in Banafit is designed to modularize prompt engineering. Instead of writing a single complex paragraph, users manage discrete blocks of logic.

### 1. Concatenation Order (Sequential Text)
While the interface looks like stackable layers, the backend treats them as a **text concatenation** pipeline. When you click "Generate", the app joins the text in this specific order:

`[System Layer] + ", " + [User Layers] + ", " + [Custom Layers]`

**Why this order matters:**
*   **System (First)**: Sets the "Global Style" and context (e.g., "Photorealistic fashion photography"). Being first ensures the AI prioritizes the visual style above all else.
*   **User (Middle)**: Defines the "Subject" (e.g., "Female model, studio lighting").
*   **Custom (Last)**: Adds "Details/Modifiers" (e.g., "Wearing a hat, blue background").

### 2. Simultaneous Generation (Parallel Processing)
Crucially, these layers do **not** represent separate image processing steps (i.e., it does not generate a body, then generate a hat on top).
The AI model receives the **entire combined prompt at once** along with the input image. It generates the final pixels in a single inference pass, ensuring lighting and shadows are consistent across all elements described in the layers.

---

## 🛠 Technical Implementation Details

### Tech Stack
*   **Framework**: React 19 (via generic CDN imports in `index.html`).
*   **Language**: TypeScript.
*   **Styling**: Tailwind CSS (via CDN).
*   **Icons**: Lucide React.
*   **AI Provider**: Google GenAI SDK (`@google/genai`).

### Data Models (`types.ts`)
*   **`InputImage`**: Stores the raw `File`, a `previewUrl` (blob), and the `base64` string required for the API.
*   **`PromptLayer`**: Object containing `content`, `type`, and `enabled` status. Allows dynamic prompt construction.
*   **`GeneratedImage`**: Stores the result `imageUrl`, parent reference, and `promptUsed` to track the genealogy of an image.

### Gemini Integration (`services/geminiService.ts`)
The app uses the `gemini-2.5-flash-image` model.

1.  **Image Handling**: The API requires Base64 strings without the MIME prefix. The `cleanBase64` utility handles this stripping.
2.  **`generateImageVariation`**:
    *   Takes `imageBase64` and `prompt`.
    *   Sends a multi-modal request (Image Part + Text Part).
    *   Extracts the inline data from the response candidates.
3.  **Parallel Execution**: `generateBatchImages` uses `Promise.all` to fire multiple API requests simultaneously based on the user's "Count" selection.

### State Management (`App.tsx`)
A single monolithic state object (`AppState`) manages the entire workflow.
*   **Navigation**: `nextStep` and `prevStep` functions handle logic gates (e.g., preventing progress if no image is uploaded).
*   **Hook Safety**: The `editPrompt` state was lifted to the top level to prevent conditional hook execution errors during the Adjustment step.

---

## 📦 Setup & Requirements

1.  **Environment Variables**:
    You must have a valid Google Gemini API Key.
    The app expects `process.env.API_KEY` to be available.
    *(Note: In a pure client-side demo without a bundler like Vite/Next, you might need to manually insert the key in `services/geminiService.ts` or configure your build tool to inject it)*.

2.  **Installation**:
    Since the file structure assumes a flat root:
    ```bash
    npm install
    npm start
    ```
    *Or simply serve the `index.html` via a live server.*

3.  **Permissions**:
    The app does not require Camera/Mic permissions, only file system access via the standard `<input type="file" />` element.
