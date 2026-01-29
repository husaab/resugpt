import { saveAs } from 'file-saver'

/**
 * Downloads a PDF file using FileSaver.js, which handles mobile browser quirks
 * including Chrome on Android that blocks programmatic anchor clicks.
 *
 * @param blobOrUrl - Either a Blob object or a URL string to the PDF
 * @param filename - The desired filename for the download
 */
export async function downloadPDF(blobOrUrl: Blob | string, filename: string): Promise<void> {
  try {
    if (typeof blobOrUrl === 'string') {
      // Fetch remote URL and convert to blob
      const response = await fetch(blobOrUrl)
      if (!response.ok) {
        throw new Error(`Failed to fetch PDF: ${response.status}`)
      }
      const blob = await response.blob()
      saveAs(blob, filename)
    } else {
      // Direct blob download
      saveAs(blobOrUrl, filename)
    }
  } catch (error) {
    console.error('Download failed:', error)
    // Fallback: open in new tab
    if (typeof blobOrUrl === 'string') {
      window.open(blobOrUrl, '_blank')
    }
    throw error
  }
}
