document.addEventListener("DOMContentLoaded", () => {
  window.loadChapter = async function loadChapter() {
    const url =
      "https://wtr-lab.com/en/serie-4635/start-with-planetary-governor/chapter-96"; // Replace with your actual URL or get it dynamically if needed

    try {
      document.getElementById("chapter-content").innerHTML =
        "<p>loading...</p>";
      const response = await fetch("/load", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const chapterHtml = await response.text(); // Get HTML response directly
      document.getElementById("chapter-content").innerHTML = chapterHtml; // Update the chapter content
    } catch (error) {
      console.error("There was a problem with the fetch operation:", error);
    }
  };
});
