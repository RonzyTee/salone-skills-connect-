export function RightColumn() {
  return (
    // STYLE: Matched card styling to the rest of the page for a unified dark theme
    <div className="bg-[#242526] p-4 rounded-xl shadow text-white space-y-2">
        <h4 className="font-semibold mb-3">Trending Topics</h4>
        {/* Note: These are static for now. A real implementation would fetch this data. */}
        <a href="#" className="block text-blue-400 hover:underline">#React</a>
        <a href="#" className="block text-blue-400 hover:underline">#Hiring</a>
        <a href="#" className="block text-blue-400 hover:underline">#DeveloperJobs</a>
    </div>
  );
}