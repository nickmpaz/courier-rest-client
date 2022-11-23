class Timer {
	private startTime?: number;

	start() {
		if (this.startTime) {
			throw new Error('Cannot start timer because timer is already running')
		}
		this.startTime = Date.now()
	}

	end() {
		if (!this.startTime) {
			throw new Error('Cannot end timer because timer is not running')
		}
		const measurement = Date.now() - this.startTime;
		this.startTime = undefined;
		return measurement;
	}

}

export { Timer }