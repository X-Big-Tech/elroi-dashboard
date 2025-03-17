import React from 'react';
import { Link } from 'react-router-dom';

const LandingPage = () => {
  return (
    <div className="bg-gradient-to-b from-blue-900 to-blue-700 min-h-screen">
      {/* Header/Navigation */}
      <header className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center max-w-7xl mx-auto">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-white">Elroi</h1>
          </div>
          <div>
            <Link 
              to="/login" 
              className="bg-white text-blue-900 px-4 py-2 rounded-md font-medium hover:bg-blue-50 transition-colors"
            >
              Log in
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight">
            Your Data, Connected and Visualized
          </h2>
          <p className="mt-6 max-w-3xl mx-auto text-xl text-blue-100">
            Elroi brings all your data from different services together in one dashboard, giving you insights and control over your digital footprint.
          </p>
          <div className="mt-10">
            <Link
              to="/login"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-blue-900 bg-white hover:bg-blue-50 md:text-lg"
            >
              Get Started
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Everything in One Dashboard
            </h2>
            <p className="mt-4 text-lg text-gray-500">
              Connect your accounts, visualize your data, and take control of your digital presence.
            </p>
          </div>

          <div className="mt-16">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {/* Feature 1 */}
              <div className="pt-6">
                <div className="flow-root bg-gray-50 rounded-lg px-6 pb-8">
                  <div className="-mt-6">
                    <div>
                      <span className="inline-flex items-center justify-center p-3 bg-blue-500 rounded-md shadow-lg">
                        <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </span>
                    </div>
                    <h3 className="mt-8 text-lg font-medium text-gray-900 tracking-tight">Data Overview</h3>
                    <p className="mt-5 text-base text-gray-500">
                      See all your data in one place with intuitive visualizations and metrics that help you understand your digital activity.
                    </p>
                  </div>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="pt-6">
                <div className="flow-root bg-gray-50 rounded-lg px-6 pb-8">
                  <div className="-mt-6">
                    <div>
                      <span className="inline-flex items-center justify-center p-3 bg-blue-500 rounded-md shadow-lg">
                        <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                      </span>
                    </div>
                    <h3 className="mt-8 text-lg font-medium text-gray-900 tracking-tight">Connected Accounts</h3>
                    <p className="mt-5 text-base text-gray-500">
                      Connect your accounts from various services like Google, Spotify, Discord, and more to centralize your data.
                    </p>
                  </div>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="pt-6">
                <div className="flow-root bg-gray-50 rounded-lg px-6 pb-8">
                  <div className="-mt-6">
                    <div>
                      <span className="inline-flex items-center justify-center p-3 bg-blue-500 rounded-md shadow-lg">
                        <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </span>
                    </div>
                    <h3 className="mt-8 text-lg font-medium text-gray-900 tracking-tight">Data Sharing Controls</h3>
                    <p className="mt-5 text-base text-gray-500">
                      Take control of your data by managing how it's shared and used, with fine-grained privacy settings.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-800 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center text-center">
          <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
            Ready to take control of your data?
          </h2>
          <p className="mt-4 text-lg text-blue-100 max-w-3xl">
            Join Elroi today and start connecting your digital life in one secure dashboard.
          </p>
          <div className="mt-8">
            <Link
              to="/login"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-blue-900 bg-white hover:bg-blue-50"
            >
              Get Started Now
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="md:flex md:items-center md:justify-between">
            <div className="flex justify-center md:justify-start">
              <h3 className="text-2xl font-bold text-white">Elroi</h3>
            </div>
            <div className="mt-8 md:mt-0">
              <p className="text-center text-base text-gray-400 md:text-right">
                &copy; {new Date().getFullYear()} Elroi Analytics. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage; 