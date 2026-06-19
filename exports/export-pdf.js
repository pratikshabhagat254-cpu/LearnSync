/**
 * LearnSync — PDF Export
 * Uses jsPDF loaded from CDN (auto-appended if not present).
 */
const ExportPdf = {
  async _ensureJsPDF() {
    if (typeof window.jspdf !== 'undefined') return;
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  },

  async exportVideo(entry) {
    try {
      await this._ensureJsPDF();
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF({ unit: 'mm', format: 'a4' });

      const purple = [124, 58, 237];
      const dark   = [20, 27, 43];
      const gray   = [74, 68, 85];
      const border = [204, 195, 216];

      let y = 20;
      const marginL = 18;
      const marginR = 192;
      const pageH   = 285;

      // Header bar
      doc.setFillColor(...purple);
      doc.rect(0, 0, 210, 12, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9); doc.setFont('helvetica', 'bold');
      doc.text('LearnSync — Precision Learning', marginL, 8);

      y = 22;

      // Title
      doc.setTextColor(...dark);
      doc.setFontSize(16); doc.setFont('helvetica', 'bold');
      const titleLines = doc.splitTextToSize(entry.videoTitle, marginR - marginL);
      doc.text(titleLines, marginL, y);
      y += titleLines.length * 7 + 3;

      // Meta
      doc.setFontSize(9); doc.setFont('helvetica', 'normal');
      doc.setTextColor(...gray);
      doc.text(`https://youtube.com/watch?v=${entry.videoId}`, marginL, y);
      y += 5;
      doc.text(`${entry.notes.length} notes  ·  Exported ${new Date().toLocaleString()}`, marginL, y);
      y += 8;

      // Divider
      doc.setDrawColor(...border);
      doc.setLineWidth(0.4);
      doc.line(marginL, y, marginR, y);
      y += 8;

      // Notes
      entry.notes.forEach((n, i) => {
        if (y > pageH - 25) { doc.addPage(); y = 20; }

        // Timestamp badge background
        doc.setFillColor(237, 224, 255);
        doc.roundedRect(marginL, y - 4, 22, 7, 2, 2, 'F');
        doc.setTextColor(...purple);
        doc.setFontSize(8); doc.setFont('helvetica', 'bold');
        doc.text(n.timestampLabel, marginL + 2, y + 0.5);

        y += 6;

        // Note text
        doc.setTextColor(...dark);
        doc.setFontSize(10); doc.setFont('helvetica', 'normal');
        const noteLines = doc.splitTextToSize(n.note, marginR - marginL);
        noteLines.forEach(line => {
          if (y > pageH - 15) { doc.addPage(); y = 20; }
          doc.text(line, marginL, y);
          y += 5.5;
        });

        // Date
        doc.setFontSize(8); doc.setTextColor(...gray);
        doc.text(new Date(n.createdAt).toLocaleString(), marginL, y);
        y += 4;

        // Separator
        if (i < entry.notes.length - 1) {
          doc.setDrawColor(...border);
          doc.setLineWidth(0.2);
          doc.line(marginL, y + 1, marginR, y + 1);
          y += 8;
        }
      });

      const safeTitle = entry.videoTitle.replace(/[/\\?%*:|"<>]/g, '-').slice(0, 50);
      doc.save(`${safeTitle}.pdf`);
    } catch (err) {
      console.error('[LearnSync] PDF export error:', err);
      alert('PDF export failed. Please check your internet connection and try again.');
    }
  },

  async exportAll(library) {
    // Export each video as separate PDF (concatenation requires premium jsPDF)
    for (const entry of library) {
      await this.exportVideo(entry);
    }
  },
};
