export function Footer() {
  return (
    <footer className="border-t border-gray-800 bg-gray-950/50 backdrop-blur-sm py-3 px-6 mt-auto">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-500">
        <p>
          © {new Date().getFullYear()} AlphaTrader AI. Data provided for informational purposes only.
        </p>
        <p className="text-gray-600">
          Not affiliated with or endorsed by data providers. Not investment advice.
        </p>
      </div>
    </footer>
  );
}
