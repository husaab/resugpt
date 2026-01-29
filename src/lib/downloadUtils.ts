/**
 * Downloads a PDF file with mobile browser support.
 *
 * Mobile Chrome blocks programmatic anchor clicks on blob URLs.
 * This utility uses different strategies based on the input:
 * - For remote URLs: Opens directly (browser handles Content-Disposition)
 * - For local blobs: Uses data URL approach which works on mobile
 *
 * @param blobOrUrl - Either a Blob object or a URL string to the PDF
 * @param filename - The desired filename for the download
 */
export async function downloadPDF(blobOrUrl: Blob | string, filename: string): Promise<void> {
  try {
    if (typeof blobOrUrl === 'string') {
      // For remote URLs, fetch as blob then use data URL approach
      const response = await fetch(blobOrUrl)
      if (!response.ok) {
        throw new Error(`Failed to fetch PDF: ${response.status}`)
      }
      const blob = await response.blob()
      await downloadBlob(blob, filename)
    } else {
      // Direct blob download
      await downloadBlob(blobOrUrl, filename)
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

/**
 * Downloads a blob using the best method for the current browser.
 * Uses data URL for mobile compatibility.
 */
async function downloadBlob(blob: Blob, filename: string): Promise<void> {
  // Check if we're on a mobile device
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  )

  // Check for iOS Chrome (CriOS) which needs special handling
  const isIOSChrome = /CriOS/i.test(navigator.userAgent)

  // Check for iOS Safari
  const isIOSSafari = /iPhone|iPad|iPod/i.test(navigator.userAgent) &&
                      /Safari/i.test(navigator.userAgent) &&
                      !/CriOS|FxiOS/i.test(navigator.userAgent)

  if (isMobile || isIOSChrome) {
    // Mobile approach: Convert to data URL and open in new window
    // This triggers the browser's native download behavior
    const reader = new FileReader()

    return new Promise((resolve, reject) => {
      reader.onloadend = () => {
        const dataUrl = reader.result as string

        if (isIOSSafari) {
          // iOS Safari: open data URL in new tab (user can then share/save)
          const newWindow = window.open(dataUrl, '_blank')
          if (!newWindow) {
            // Popup blocked, try location change
            window.location.href = dataUrl
          }
          resolve()
        } else {
          // Android Chrome and others: use anchor with data URL
          const link = document.createElement('a')
          link.href = dataUrl
          link.download = filename
          link.style.display = 'none'
          document.body.appendChild(link)

          // Use a small timeout to ensure DOM is ready
          setTimeout(() => {
            link.click()
            document.body.removeChild(link)
            resolve()
          }, 100)
        }
      }

      reader.onerror = () => {
        reject(new Error('Failed to read blob as data URL'))
      }

      reader.readAsDataURL(blob)
    })
  } else {
    // Desktop approach: Use blob URL (more efficient for large files)
    const blobUrl = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = blobUrl
    link.download = filename
    link.style.display = 'none'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    // Clean up blob URL after a delay
    setTimeout(() => URL.revokeObjectURL(blobUrl), 40000)
  }
}
