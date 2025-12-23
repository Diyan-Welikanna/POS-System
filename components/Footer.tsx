export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-gray-800 text-white mt-auto">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-2">POS System</h3>
            <p className="text-gray-400 text-sm">
              Modern Point of Sale system with inventory management and analytics.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="/pos" className="text-gray-400 hover:text-white">
                  POS Terminal
                </a>
              </li>
              <li>
                <a href="/inventory" className="text-gray-400 hover:text-white">
                  Inventory
                </a>
              </li>
              <li>
                <a href="/reports" className="text-gray-400 hover:text-white">
                  Reports
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Support</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="text-gray-400 hover:text-white">
                  Documentation
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-white">
                  Help Center
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-400 hover:text-white">
                  Contact Us
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-gray-700 pt-6 text-center text-sm text-gray-400">
          <p>&copy; {currentYear} POS System. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
