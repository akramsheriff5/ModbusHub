import { Fragment, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Disclosure, Menu, Transition } from '@headlessui/react';
import { HomeIcon, CpuChipIcon, ChartBarIcon, Cog6ToothIcon, ArrowLeftOnRectangleIcon, ChevronDownIcon, PlusIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';

const navigation = [
  { name: 'Dashboard', href: '/', icon: HomeIcon },
  {
    name: 'Devices',
    icon: CpuChipIcon,
    children: [
      { name: 'All Devices', href: '/devices' },
      // { name: 'Add New Device', href: '/add-plc' },
    ],
  },
  { name: 'Add New Device', href: '/add-plc', icon: ChartBarIcon },
  // { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
];

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [devicesOpen, setDevicesOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans">
      {/* Sidebar */}
      <aside className={`flex flex-col h-screen w-64 bg-white border-r border-gray-200 transition-transform duration-300 ${sidebarOpen ? '' : '-translate-x-full'} z-40 fixed lg:static`}>
        <div className="flex items-center h-16 px-6 font-bold text-xl text-gray-900 border-b border-gray-100">Modbus Control</div>
        <nav className="flex-1 px-4 py-6 overflow-y-auto">
          <div className="text-xs text-gray-400 font-semibold mb-2 pl-2">Main Navigation</div>
          <ul className="space-y-1">
            {navigation.map((item) =>
              item.children ? (
                <li key={item.name}>
                  <button
                    className={classNames(
                      'flex items-center w-full px-2 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition',
                      devicesOpen ? 'bg-gray-100' : '',
                    )}
                    onClick={() => setDevicesOpen((open) => !open)}
                  >
                    <item.icon className="h-5 w-5 mr-3 text-gray-400" />
                    <span className="flex-1 text-left">{item.name}</span>
                    <ChevronDownIcon className={classNames('h-4 w-4 ml-auto transition-transform', devicesOpen ? 'rotate-180' : '')} />
                  </button>
                  {devicesOpen && (
                    <ul className="ml-8 mt-1 space-y-1">
                      {item.children.map((child) => (
                        <li key={child.name}>
                          <Link
                            to={child.href}
                            className={classNames(
                              location.pathname === child.href
                                ? 'bg-blue-50 text-blue-700 font-semibold'
                                : 'text-gray-700 hover:bg-gray-100',
                              'block px-2 py-2 rounded-lg text-sm transition'
                            )}
                          >
                            {child.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ) : (
                <li key={item.name}>
                  <Link
                    to={item.href}
                    className={classNames(
                      location.pathname === item.href
                        ? 'bg-blue-50 text-blue-700 font-semibold'
                        : 'text-gray-700 hover:bg-gray-100',
                      'flex items-center px-2 py-2 rounded-lg transition font-medium'
                    )}
                  >
                    <item.icon className="h-5 w-5 mr-3 text-gray-400" />
                    {item.name}
                  </Link>
                </li>
              )
            )}
          </ul>
        </nav>
        <div className="mt-auto px-4 pb-6">
          <button
            onClick={logout}
            className="flex items-center w-full px-2 py-2 rounded-lg text-red-600 hover:bg-red-50 font-medium transition"
          >
            <ArrowLeftOnRectangleIcon className="h-5 w-5 mr-3" />
            Log Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 min-h-screen ml-0  transition-all duration-300">
        <header className="flex items-center justify-end h-16 px-8 bg-white border-b border-gray-100">
          <Menu as="div" className="relative ml-3">
            <div>
              <Menu.Button className="flex rounded-full bg-blue-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                <span className="sr-only">Open user menu</span>
                <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                  {user?.username?.[0]?.toUpperCase()}
                </div>
              </Menu.Button>
            </div>
            <Transition
              as={Fragment}
              enter="transition ease-out duration-200"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={logout}
                      className={classNames(
                        active ? 'bg-gray-100' : '',
                        'block w-full px-4 py-2 text-left text-sm text-gray-700'
                      )}
                    >
                      Sign out
                    </button>
                  )}
                </Menu.Item>
              </Menu.Items>
            </Transition>
          </Menu>
        </header>
        <main className="p-2 bg-[#F8FAFC] min-h-[calc(100vh-4rem)]">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
} 