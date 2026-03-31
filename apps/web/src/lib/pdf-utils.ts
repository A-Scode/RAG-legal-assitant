import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

interface ExportPdfOptions {
  filename?: string
  title?: string
  timestamp?: boolean
}

export async function exportElementToPdf(
  element: HTMLElement,
  options: ExportPdfOptions = {}
) {
  const { 
    filename = 'legal-assistant-answer.pdf',
    title = 'AI Legal Assistant Answer',
    timestamp = true 
  } = options

  // Create a high-quality canvas from the element
  const canvas = await html2canvas(element, {
    scale: 2, // High resolution
    useCORS: true,
    backgroundColor: '#ffffff', // Force white background for PDF
    logging: false,
    onclone: (clonedDoc) => {
      // 1. Global Fix: html2canvas crashes on oklch() colors in CSS variables/style tags.
      // We must strip or replace them in the head of the cloned document.
      const styles = clonedDoc.getElementsByTagName('style');
      for (let i = 0; i < styles.length; i++) {
        try {
          styles[i].innerHTML = styles[i].innerHTML.replace(/oklch\([^)]+\)/g, '#000000');
        } catch (e) {
          console.warn('Failed to sanitize style tag', e);
        }
      }

      // 2. Element-specific Fixes
      const clonedElement = clonedDoc.getElementById(element.id)
      if (clonedElement) {
        // Force light mode styles for the PDF
        clonedElement.classList.remove('dark', 'dark:prose-invert')
        clonedElement.classList.add('light')
        clonedElement.style.color = '#000000'
        clonedElement.style.backgroundColor = '#ffffff'
        
        // Recursively remove oklch and modern CSS from inline styles
        const allElements = clonedElement.querySelectorAll('*')
        allElements.forEach((el: any) => {
          if (el instanceof HTMLElement) {
            // Apply standard colors to child elements to ensure contrast
            const style = clonedDoc.defaultView?.getComputedStyle(el)
            if (style) {
              if (style.color.includes('oklch')) el.style.color = '#000000'
              if (style.backgroundColor.includes('oklch')) {
                // If it's a bubble/card, maybe keep it light gray instead of transparent
                el.style.backgroundColor = '#ffffff'
              }
              if (style.borderColor.includes('oklch')) el.style.borderColor = '#e5e7eb'
            }
          }
        })
      }
    }
  })

  const imgData = canvas.toDataURL('image/png')
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  })

  const pdfWidth = pdf.internal.pageSize.getWidth()
  const pdfHeight = pdf.internal.pageSize.getHeight()
  
  // Calculate margins and actual content area
  const margin = 10
  const contentWidth = pdfWidth - (margin * 2)
  const imgWidth = contentWidth
  const imgHeight = (canvas.height * imgWidth) / canvas.width

  // Add a header
  pdf.setFontSize(10)
  pdf.setTextColor(150, 150, 150)
  pdf.text(title, margin, margin - 2)
  
  if (timestamp) {
    const dateStr = new Date().toLocaleString()
    pdf.text(dateStr, pdfWidth - margin - 30, margin - 2, { align: 'right' })
  }

  // Handle multi-page if height exceeds A4
  let heightLeft = imgHeight
  let position = margin

  pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight)
  heightLeft -= (pdfHeight - margin * 2)

  while (heightLeft >= 0) {
    position = heightLeft - imgHeight + margin
    pdf.addPage()
    pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight)
    heightLeft -= (pdfHeight - margin * 2)
  }

  pdf.save(filename)
}
