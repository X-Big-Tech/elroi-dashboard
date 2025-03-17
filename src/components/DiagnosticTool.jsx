import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const DiagnosticTool = () => {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [schemaInfo, setSchemaInfo] = useState(null);

  const checkDatabase = async () => {
    setLoading(true);
    setError(null);
    setResults(null);
    setSchemaInfo(null);

    try {
      const diagnostics = {};

      // Check if user is authenticated
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) throw authError;
      
      diagnostics.authentication = {
        status: 'success',
        userId: user.id,
        email: user.email
      };

      // Check tables existence and permissions
      const tables = ['oauth_connections', 'provider_data', 'provider_data_points'];
      diagnostics.tables = {};

      for (const table of tables) {
        try {
          const { data, error: tableError } = await supabase
            .from(table)
            .select('count(*)', { count: 'exact' });
          
          if (tableError) {
            diagnostics.tables[table] = {
              exists: false,
              error: tableError.message,
              code: tableError.code
            };
          } else {
            diagnostics.tables[table] = {
              exists: true,
              count: data.length > 0 ? data[0].count : 0
            };
          }
        } catch (tableError) {
          diagnostics.tables[table] = {
            exists: false,
            error: tableError.message
          };
        }
      }

      // Fetch table schemas
      const schemaData = {};
      for (const table of tables) {
        if (diagnostics.tables[table].exists) {
          try {
            // Use system schema tables to get column information
            const { data: columns, error: schemaError } = await supabase
              .rpc('get_table_definition', { table_name: table });
              
            if (schemaError) {
              schemaData[table] = {
                error: schemaError.message,
                code: schemaError.code
              };
            } else {
              schemaData[table] = columns || [];
            }
          } catch (schemaError) {
            schemaData[table] = {
              error: schemaError.message
            };
          }
        }
      }
      
      setSchemaInfo(schemaData);

      // Check Row Level Security (RLS) policies
      try {
        // Try inserting a test record
        const { error: insertError } = await supabase
          .from('oauth_connections')
          .insert({
            user_id: user.id,
            provider: 'test_diagnostic',
            provider_user_id: 'test_id_' + Date.now() // Add provider_user_id
          })
          .select();

        diagnostics.rls = {
          insertPermission: !insertError,
          error: insertError ? insertError.message : null,
          code: insertError ? insertError.code : null
        };

        // If successful, delete the test record
        if (!insertError) {
          await supabase
            .from('oauth_connections')
            .delete()
            .eq('provider', 'test_diagnostic');
        }
      } catch (rlsError) {
        diagnostics.rls = {
          insertPermission: false,
          error: rlsError.message
        };
      }

      setResults(diagnostics);
    } catch (error) {
      console.error('Diagnostic error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Fallback method to check schema if RPC is not available
  const checkTableSchema = async () => {
    setLoading(true);
    setSchemaInfo(null);
    
    try {
      const tables = ['oauth_connections', 'provider_data', 'provider_data_points'];
      const schemaData = {};
      
      for (const table of tables) {
        try {
          // Try to get one row to inspect columns
          const { data, error } = await supabase
            .from(table)
            .select('*')
            .limit(1);
          
          if (error) {
            schemaData[table] = {
              error: error.message,
              code: error.code
            };
          } else if (data && data.length > 0) {
            // Get column names from the first row
            schemaData[table] = Object.keys(data[0]).map(column => ({
              column_name: column,
              data_type: typeof data[0][column],
              sample_value: data[0][column]
            }));
          } else {
            schemaData[table] = { message: 'No data available to inspect schema' };
          }
        } catch (error) {
          schemaData[table] = {
            error: error.message
          };
        }
      }
      
      setSchemaInfo(schemaData);
    } catch (error) {
      console.error('Schema check error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h2 className="text-lg font-semibold mb-4">Database Diagnostic Tool</h2>
      
      <div className="flex space-x-4 mb-4">
        <button
          onClick={checkDatabase}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300"
        >
          {loading ? 'Running diagnostics...' : 'Run Diagnostics'}
        </button>
        
        <button
          onClick={checkTableSchema}
          disabled={loading}
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:bg-gray-300"
        >
          Check Table Schema
        </button>
      </div>
      
      {error && (
        <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          <p className="font-bold">Error:</p>
          <p>{error}</p>
        </div>
      )}
      
      {schemaInfo && (
        <div className="mt-4">
          <h3 className="text-md font-medium mb-2">Table Schema Information:</h3>
          
          {Object.entries(schemaInfo).map(([table, info]) => (
            <div key={table} className="mb-4 border p-3 rounded">
              <h4 className="font-medium">{table} Schema:</h4>
              
              {info.error ? (
                <p className="text-red-500">Error: {info.error}</p>
              ) : Array.isArray(info) ? (
                <div className="overflow-x-auto mt-2">
                  <table className="min-w-full border">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="px-4 py-2 border">Column</th>
                        <th className="px-4 py-2 border">Type</th>
                        <th className="px-4 py-2 border">Nullable</th>
                      </tr>
                    </thead>
                    <tbody>
                      {info.map((column, index) => (
                        <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-4 py-2 border">{column.column_name}</td>
                          <td className="px-4 py-2 border">{column.data_type}</td>
                          <td className="px-4 py-2 border">
                            {column.is_nullable === 'NO' ? 
                              <span className="text-red-500 font-bold">Required</span> : 
                              <span className="text-green-500">Nullable</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p>{info.message || 'No schema information available'}</p>
              )}
            </div>
          ))}
        </div>
      )}
      
      {results && (
        <div className="mt-4">
          <h3 className="text-md font-medium mb-2">Diagnostic Results:</h3>
          
          <div className="mb-4">
            <h4 className="font-medium">Authentication:</h4>
            <div className="pl-4">
              <p>Status: {results.authentication.status === 'success' ? 
                <span className="text-green-600">Success</span> : 
                <span className="text-red-600">Failed</span>}
              </p>
              <p>User ID: {results.authentication.userId}</p>
              <p>Email: {results.authentication.email}</p>
            </div>
          </div>
          
          <div className="mb-4">
            <h4 className="font-medium">Tables:</h4>
            {Object.entries(results.tables).map(([table, info]) => (
              <div key={table} className="pl-4 mb-2">
                <p>
                  {table}: {info.exists ? 
                    <span className="text-green-600">Exists</span> : 
                    <span className="text-red-600">Missing</span>}
                </p>
                {info.exists && <p>Record count: {info.count}</p>}
                {info.error && (
                  <p className="text-red-600">
                    Error: {info.code ? `[${info.code}] ` : ''}{info.error}
                  </p>
                )}
              </div>
            ))}
          </div>
          
          <div className="mb-4">
            <h4 className="font-medium">Row Level Security:</h4>
            <div className="pl-4">
              <p>
                Insert Permission: {results.rls.insertPermission ? 
                  <span className="text-green-600">Allowed</span> : 
                  <span className="text-red-600">Denied</span>}
              </p>
              {results.rls.error && (
                <p className="text-red-600">
                  Error: {results.rls.code ? `[${results.rls.code}] ` : ''}{results.rls.error}
                </p>
              )}
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 text-blue-700 rounded">
            <p className="font-bold">Recommendation:</p>
            <ol className="list-decimal ml-5">
              {!results.tables['oauth_connections'].exists && 
                <li>Create the oauth_connections table by running the SQL migration script.</li>}
              
              {!results.tables['provider_data'].exists && 
                <li>Create the provider_data table by running the SQL migration script.</li>}
              
              {!results.tables['provider_data_points'].exists && 
                <li>Create the provider_data_points table by running the SQL migration script.</li>}
              
              {!results.rls.insertPermission && 
                <li>Fix Row Level Security policies to allow users to insert their own data.</li>}
                
              {Object.values(results.tables).every(t => t.exists) && 
                results.rls.insertPermission && 
                <li>All table checks passed! If you're still having issues, check console logs for other errors.</li>}
            </ol>
          </div>
        </div>
      )}
    </div>
  );
};

export default DiagnosticTool; 