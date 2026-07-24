import { NextRequest, NextResponse } from "next/server";
const pdfParse = require("pdf-parse");
import mammoth from "mammoth";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    let extractedText = "";

    const mimeType = file.type;
    const fileName = file.name.toLowerCase();

    if (mimeType === "application/pdf" || fileName.endsWith(".pdf")) {
      const data = await pdfParse(buffer);
      extractedText = data.text;
    } else if (
      mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || 
      fileName.endsWith(".docx")
    ) {
      const result = await mammoth.extractRawText({ buffer });
      extractedText = result.value;
    } else if (
      mimeType === "text/plain" || 
      mimeType === "text/markdown" || 
      fileName.endsWith(".txt") || 
      fileName.endsWith(".md")
    ) {
      extractedText = buffer.toString("utf-8");
    } else {
      return NextResponse.json({ error: "Unsupported file format. Please upload TXT, MD, PDF, or DOCX." }, { status: 400 });
    }

    // Clean up text
    const cleanText = extractedText
      .replace(/\r\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    return NextResponse.json({ text: cleanText });
  } catch (error: any) {
    console.error("Text Extraction Error:", error);
    return NextResponse.json({ error: error.message || "Failed to extract text from file" }, { status: 500 });
  }
}
