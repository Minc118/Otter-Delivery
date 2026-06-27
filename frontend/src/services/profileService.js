const PROFILE_API_BASE_URL = "http://localhost:8006";

export async function login(username) {
    const response = await fetch(
        `${PROFILE_API_BASE_URL}/profiles/login/${username}`
    );

    if (!response.ok) {
        throw new Error("Profile not found");
    }

    return await response.json();
}

export async function getOrders(profileId) {
    const response = await fetch(
        `${PROFILE_API_BASE_URL}/profiles/${profileId}/orders`
    );

    if (!response.ok) {
        throw new Error("Could not load orders");
    }

    return await response.json();
}

export async function updateProfile(profileId, profile) {
    const response = await fetch(
        `${PROFILE_API_BASE_URL}/profiles/${profileId}`,
        {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(profile),
        },
    );

    if (!response.ok) {
        throw new Error("Could not update profile");
    }

    return await response.json();
}

