import { useState } from "react";

export default function AIFoodSearch() {
  const [query, setQuery] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
  }

  return (
    <section className="flex flex-col items-center justify-center py-24 px-margin-x max-w-container-max mx-auto text-center">
      <h1 className="font-display-hero text-display-hero text-on-surface mb-stack-md max-w-3xl">
        What would you like to eat today?
      </h1>
      <p className="font-body-md text-body-md text-on-surface-variant mb-stack-lg max-w-2xl">
        Describe your craving, and our AI will find the perfect dish for you
        right now.
      </p>
      <form className="relative w-full max-w-3xl group" onSubmit={handleSubmit}>
        <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
          <span className="material-symbols-outlined text-primary-light text-2xl group-focus-within:text-primary transition-colors">
            magic_button
          </span>
        </div>
        <input
          className="w-full h-16 pl-14 pr-32 rounded-full border border-primary-light bg-surface-container-lowest text-on-surface font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-primary-light focus:border-transparent ai-shadow transition-all placeholder:text-outline-variant"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="e.g., A warm, hearty vegetarian bowl..."
          type="text"
          value={query}
        />
        <button
          className="absolute inset-y-2 right-2 px-6 bg-primary-container text-on-primary rounded-full font-button text-button hover:bg-surface-tint transition-colors"
          type="submit"
        >
          Find
        </button>
      </form>
    </section>
  );
}
