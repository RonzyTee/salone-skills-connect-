// /components/ui/loader.tsx

export default function Loader() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-black">
      <div className="flex flex-col items-center gap-4">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-blue-500 border-t-transparent"></div>
        <p className="text-xl text-gray-300">Loading Page...</p>
      </div>
    </div>
  );
}