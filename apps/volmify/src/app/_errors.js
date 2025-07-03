"use client";

// https://nextjs.org/docs/app/api-reference/file-conventions/error

/** @import { ErrorInfo, ReactNode } from 'react' */
import React, { Component } from "react";

/**
 * @typedef {{
 *   children: ReactNode
 *   onError?: (error: Error, errorInfo: ErrorInfo) => void
 * }} ErrorBoundaryProps
 *
 * @typedef {{
 *   hasError: boolean
 * }} ErrorBoundaryState
 */

export class GracefullyDegradingErrorBoundary extends /** @type {typeof Component<ErrorBoundaryProps,ErrorBoundaryState>} */ (
	Component
) {
	/** @type {React.RefObject<HTMLDivElement|null>} */
	#contentRef;

	/**
	 * @param {ErrorBoundaryProps} props
	 */
	constructor(props) {
		super(props);
		this.state = { hasError: false };
		this.#contentRef = React.createRef();
	}

	/**
	 * @param {Error} _
	 * @returns {ErrorBoundaryState}
	 */
	static getDerivedStateFromError(_) {
		return { hasError: true };
	}

	/**
	 *  @param {Error} error
	 *  @param {ErrorInfo} errorInfo
	 */
	componentDidCatch(error, errorInfo) {
		if (this.props.onError) {
			this.props.onError(error, errorInfo);
		}
	}

	render() {
		if (this.state.hasError) {
			// Render the current HTML content without hydration
			return (
				<>
					<div
						ref={this.#contentRef}
						suppressHydrationWarning
						dangerouslySetInnerHTML={{
							__html: this.#contentRef.current?.innerHTML ?? "",
						}}
					/>
					<div className="fixed right-0 bottom-0 left-0 bg-red-600 px-6 py-4 text-center text-white">
						<p className="font-semibold">An error occurred during page rendering</p>
					</div>
				</>
			);
		}

		return <div ref={this.#contentRef}>{this.props.children}</div>;
	}
}

export default GracefullyDegradingErrorBoundary;
