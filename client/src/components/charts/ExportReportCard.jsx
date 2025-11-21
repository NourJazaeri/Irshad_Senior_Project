import React, { useState } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export default function ExportReportCard() {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    try {
      setExporting(true);
      const dashboard = document.getElementById("supervisor-dashboard-root");
      if (!dashboard) {
        alert("Dashboard not found");
        return;
      }

      // Store original scroll position
      const originalScrollPos = window.scrollY;
      
      // Scroll to top to ensure full capture
      window.scrollTo(0, 0);
      
      // Hide elements with no-export class
      const noExportElements = document.querySelectorAll('.no-export');
      noExportElements.forEach(el => el.style.display = 'none');
      
      // Wait a bit for any animations to settle
      await new Promise(resolve => setTimeout(resolve, 300));

      // Get the full height of the dashboard including scrollable content
      const fullHeight = dashboard.scrollHeight;
      const fullWidth = dashboard.scrollWidth;

      // Capture the dashboard with better quality settings
      const canvas = await html2canvas(dashboard, {
        scale: 1.5,
        useCORS: true,
        logging: false,
        backgroundColor: "#f9fafb",
        width: fullWidth,
        height: fullHeight,
        windowWidth: fullWidth,
        windowHeight: fullHeight,
        scrollY: -window.scrollY,
        scrollX: -window.scrollX,
      });

      // Restore hidden elements
      noExportElements.forEach(el => el.style.display = '');
      
      // Restore scroll position
      window.scrollTo(0, originalScrollPos);

      const imgData = canvas.toDataURL("image/png", 1.0);
      
      // Use A4 size with portrait orientation for better fit
      const pdf = new jsPDF({
        orientation: fullHeight > fullWidth ? "portrait" : "landscape",
        unit: "mm",
        format: "a4",
      });

      // Calculate dimensions to fit page
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      // Calculate image dimensions maintaining aspect ratio
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      
      // Calculate scale to fit the PDF page
      const widthRatio = pdfWidth / imgWidth;
      const heightRatio = pdfHeight / imgHeight;
      const ratio = Math.min(widthRatio, heightRatio);
      
      const scaledWidth = imgWidth * ratio;
      const scaledHeight = imgHeight * ratio;
      
      // Center the image on the page
      const imgX = (pdfWidth - scaledWidth) / 2;
      const imgY = (pdfHeight - scaledHeight) / 2;
      
      // Add image to single page
      pdf.addImage(
        imgData,
        "PNG",
        imgX,
        imgY,
        scaledWidth,
        scaledHeight,
        undefined,
        "FAST"
      );

      // Add timestamp to filename
      const timestamp = new Date().toISOString().split('T')[0];
      pdf.save(`Supervisor_Dashboard_Report_${timestamp}.pdf`);
      
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <button
      className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow ml-2 disabled:opacity-50 disabled:cursor-not-allowed"
      onClick={handleExport}
      disabled={exporting}
    >
      {exporting ? "Generating..." : "Export PDF"}
    </button>
  );
}
