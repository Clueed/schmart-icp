export const Logger = (() => {
	let debugEnabled = true;

	return {
		debug: (...args: unknown[]) => {
			if (debugEnabled) Logger.debug(...args);
		},
		section: (...args: unknown[]) => {
			console.log(`\n${"=".repeat(20)}`, ...args, `${"=".repeat(20)}\n`);
		},
		log: (...args: unknown[]) => Logger.log(...args),
		info: (...args: unknown[]) => console.info(...args),
		warn: (...args: unknown[]) => console.warn(...args),
		error: (...args: unknown[]) => console.error(...args),
		setDebug: (enabled: boolean) => {
			debugEnabled = !!enabled;
		},
	};
})();
