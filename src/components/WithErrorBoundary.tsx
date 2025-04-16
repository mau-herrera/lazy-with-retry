import React, { useCallback } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import ErrorFallback from './ErrorFallback';

interface WithErrorBoundaryProps {
    children: React.ReactNode;
}

const WithErrorBoundary: React.FC<WithErrorBoundaryProps> = ({ children }) => {

    // On Error, log the error to an error reporting service
    const handleError = useCallback((error: Error) => {
        console.error('Error caught by ErrorBoundary:', error)
    }, []);
    return (
        <ErrorBoundary FallbackComponent={ErrorFallback} onError={handleError}>
            {children}
        </ErrorBoundary>
    );
};

export default WithErrorBoundary;
