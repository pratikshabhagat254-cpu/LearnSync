/**
 * LearnSync — TXT Export
 */
const ExportTxt = {
  formatVideo(entry) {
    const lines = [];
    lines.push(`LearnSync Notes`);
    lines.push(`===============`);
    lines.push(`Video: ${entry.videoTitle}`);
    lines.push(`URL:   https://www.youtube.com/watch?v=${entry.videoId}`);
    lines.push(`Notes: ${entry.notes.length}`);
    lines.push(`Exported: ${new Date().toLocaleString()}`);
    lines.push('');
    lines.push('─'.repeat(50));
    lines.push('');

    entry.notes.forEach(n => {
      lines.push(`[${n.timestampLabel}]`);
      lines.push(n.note);
      lines.push('');
    });

    return lines.join('\n');
  },

  exportVideo(entry) {
    const content = this.formatVideo(entry);
    const safeTitle = entry.videoTitle.replace(/[/\\?%*:|"<>]/g, '-').slice(0, 50);
    this._download(content, `${safeTitle}.txt`);
  },

  exportAll(library) {
    const parts = library.map(entry => this.formatVideo(entry));
    const content = parts.join('\n\n' + '='.repeat(60) + '\n\n');
    this._download(content, `learnsync-all-notes-${Date.now()}.txt`);
  },

  _download(content, filename) {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  },
};
