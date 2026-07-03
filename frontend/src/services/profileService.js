const PROFILE_API_BASE_URL =
    import.meta.env.VITE_PROFILE_SERVICE_URL ?? "http://localhost:8006";

export class ProfileServiceUnavailableError extends Error {
    constructor() {
        super("Profile service is currently unavailable");
        this.name = "ProfileServiceUnavailableError";
    }
}

export class ProfileNotFoundError extends Error {
    constructor() {
        super("Profile not found");
        this.name = "ProfileNotFoundError";
    }
}

async function requestProfileService(path, options = {}) {
    let response;

    try {
        response = await fetch(`${PROFILE_API_BASE_URL}${path}`, {
            headers: {
                "Content-Type": "application/json",
                ...options.headers,
            },
            ...options,
        });
    } catch {
        throw new ProfileServiceUnavailableError();
    }

    if (response.status === 404) {
        throw new ProfileNotFoundError();
    }

    if (!response.ok) {
        throw new Error("Profile Service request failed");
    }

    return response.json();
}

export function isProfileServiceUnavailable(error) {
    return error instanceof ProfileServiceUnavailableError;
}

export async function login(username) {
    return requestProfileService(
        `/profiles/login/${encodeURIComponent(username)}`,
    );
}

export async function getProfile(profileId) {
    return requestProfileService(`/profiles/${profileId}`);
}

export async function getOrders(profileId) {
    return requestProfileService(`/profiles/${profileId}/orders`);
}

export async function updateProfile(profileId, profile) {
    return requestProfileService(`/profiles/${profileId}`, {
        method: "PUT",
        body: JSON.stringify(profile),
    });
}
