import React from 'react';
import { Link } from 'react-router-dom';
import { FaChartBar, FaLink, FaShieldAlt, FaTools } from 'react-icons/fa';

const Sidebar = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'overview', label: 'Data Overview', icon: <FaChartBar /> },
    { id: 'connections', label: 'Connected Accounts', icon: <FaLink /> },
    { id: 'controls', label: 'Data Controls', icon: <FaShieldAlt /> },
    { id: 'diagnostics', label: 'Diagnostics', icon: <FaTools /> }
  ];

  return (
    <div className="w-64 bg-gray-800 text-white h-full flex-shrink-0">
      <div className="p-4">
        <h2 className="text-xl font-bold">Elroi</h2>
        <p className="text-gray-400 text-sm">Data Dashboard</p>
          </div>
      
      <nav className="mt-6">
        <ul>
          {tabs.map(tab => (
            <li key={tab.id} className="mb-2">
            <button
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center px-4 py-3 text-left ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-700'
                }`}
              >
                <span className="mr-3">{tab.icon}</span>
                {tab.label}
            </button>
            </li>
          ))}
        </ul>
      </nav>
      
      <div className="absolute bottom-0 w-64 p-4 bg-gray-900">
        <Link to="/login" className="text-gray-400 hover:text-white text-sm">
          Sign Out
        </Link>
      </div>
    </div>
  );
};

export default Sidebar; 