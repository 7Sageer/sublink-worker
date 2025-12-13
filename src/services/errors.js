export class ServiceError extends Error {
    constructor(message, status = 500) {
        super(message);
        this.name = 'ServiceError';
        this.status = status;
    }
}

export class MissingDependencyError extends ServiceError {
    constructor(message = 'Required dependency is not available') {
        super(message, 501);
        this.name = 'MissingDependencyError';
    }
}

export class InvalidPayloadError extends ServiceError {
    constructor(message = 'Invalid payload') {
        super(message, 400);
        this.name = 'InvalidPayloadError';
    }
}
