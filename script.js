// =====================================================
// AWS API URL
// =====================================================

const API_URL =
    "https://7q6bfudn8j.execute-api.eu-north-1.amazonaws.com";


// =====================================================
// DOM ELEMENTS
// =====================================================

const notesContainer = document.getElementById("notesContainer");

const searchInput = document.getElementById("searchInput");

const newNoteBtn = document.getElementById("newNoteBtn");

const noteModal = document.getElementById("noteModal");

const closeModal = document.getElementById("closeModal");

const cancelBtn = document.getElementById("cancelBtn");

const noteForm = document.getElementById("noteForm");

const noteIdInput = document.getElementById("noteId");

const titleInput = document.getElementById("title");

const contentInput = document.getElementById("content");

const modalTitle = document.getElementById("modalTitle");

const statusMessage = document.getElementById("statusMessage");

const allNotesBtn = document.getElementById("allNotesBtn");

const favoritesBtn = document.getElementById("favoritesBtn");


// =====================================================
// APPLICATION STATE
// =====================================================

let notes = [];

let favorites = JSON.parse(
    localStorage.getItem("favoriteNotes") || "[]"
);

let showingFavorites = false;


// =====================================================
// LOAD NOTES
// =====================================================

async function loadNotes() {

    try {

        showStatus("Loading notes...");

        const response = await fetch(`${API_URL}/notes`);

        if (!response.ok) {
            throw new Error("Unable to load notes");
        }

        const data = await response.json();

        notes = data.notes || [];

        renderNotes();

        showStatus("");

    } catch (error) {

        console.error(error);

        showStatus(
            "Unable to load notes. Please check your API."
        );

    }

}


// =====================================================
// DISPLAY NOTES
// =====================================================

function renderNotes() {

    const searchText =
        searchInput.value.toLowerCase().trim();

    let filteredNotes = notes.filter(note => {

        const title =
            (note.title || "").toLowerCase();

        const content =
            (note.content || "").toLowerCase();

        return (
            title.includes(searchText) ||
            content.includes(searchText)
        );

    });


    // Favorites filter

    if (showingFavorites) {

        filteredNotes = filteredNotes.filter(note =>
            favorites.includes(note.noteId)
        );

    }


    notesContainer.innerHTML = "";


    if (filteredNotes.length === 0) {

        notesContainer.innerHTML = `
            <div class="empty-state">
                <h2>No notes found</h2>
                <p>Create a new note to get started.</p>
            </div>
        `;

        return;
    }


    filteredNotes.forEach(note => {

        const card =
            document.createElement("div");

        card.className = "note-card";


        const isFavorite =
            favorites.includes(note.noteId);


        card.innerHTML = `

            <h3>${escapeHtml(note.title)}</h3>

            <div class="note-content">
                ${escapeHtml(note.content)}
            </div>

            <div class="note-date">
                Updated ${formatDate(note.updatedAt)}
            </div>

            <div class="note-actions">

                <button
                    class="edit-btn"
                    onclick="editNote('${note.noteId}')"
                >
                    Edit
                </button>

                <button
                    class="delete-btn"
                    onclick="deleteNote('${note.noteId}')"
                >
                    Delete
                </button>

                <button
                    class="favorite-btn"
                    onclick="toggleFavorite('${note.noteId}')"
                >
                    ${isFavorite ? "★" : "☆"}
                </button>

            </div>

        `;


        notesContainer.appendChild(card);

    });

}


// =====================================================
// CREATE / UPDATE NOTE
// =====================================================

noteForm.addEventListener("submit", async function(event) {

    event.preventDefault();


    const title =
        titleInput.value.trim();

    const content =
        contentInput.value.trim();

    const noteId =
        noteIdInput.value;


    if (!title) {

        alert("Please enter a title.");

        return;

    }


    const body = {

        title: title,

        content: content

    };


    try {

        showStatus(
            noteId
                ? "Updating note..."
                : "Creating note..."
        );


        let response;


        if (noteId) {

            // UPDATE

            response = await fetch(
                `${API_URL}/notes/${noteId}`,
                {
                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify(body)
                }
            );

        } else {

            // CREATE

            response = await fetch(
                `${API_URL}/notes`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify(body)
                }
            );

        }


        if (!response.ok) {

            throw new Error(
                "Unable to save note"
            );

        }


        closeNoteModal();

        await loadNotes();

        showStatus(
            noteId
                ? "Note updated successfully."
                : "Note created successfully."
        );


    } catch (error) {

        console.error(error);

        showStatus(
            "Something went wrong while saving the note."
        );

    }

});


// =====================================================
// EDIT NOTE
// =====================================================

function editNote(id) {

    const note =
        notes.find(
            item => item.noteId === id
        );


    if (!note) {
        return;
    }


    modalTitle.textContent =
        "Edit Note";


    noteIdInput.value =
        note.noteId;


    titleInput.value =
        note.title || "";


    contentInput.value =
        note.content || "";


    noteModal.classList.add("show");

}


// =====================================================
// DELETE NOTE
// =====================================================

async function deleteNote(id) {

    const confirmDelete =
        confirm(
            "Are you sure you want to delete this note?"
        );


    if (!confirmDelete) {
        return;
    }


    try {

        showStatus("Deleting note...");


        const response =
            await fetch(
                `${API_URL}/notes/${id}`,
                {
                    method: "DELETE"
                }
            );


        if (!response.ok) {

            throw new Error(
                "Unable to delete note"
            );

        }


        favorites =
            favorites.filter(
                favoriteId =>
                    favoriteId !== id
            );


        localStorage.setItem(
            "favoriteNotes",
            JSON.stringify(favorites)
        );


        await loadNotes();


        showStatus(
            "Note deleted successfully."
        );


    } catch (error) {

        console.error(error);

        showStatus(
            "Unable to delete note."
        );

    }

}


// =====================================================
// FAVORITES
// =====================================================

function toggleFavorite(id) {

    if (favorites.includes(id)) {

        favorites =
            favorites.filter(
                favoriteId =>
                    favoriteId !== id
            );

    } else {

        favorites.push(id);

    }


    localStorage.setItem(
        "favoriteNotes",
        JSON.stringify(favorites)
    );


    renderNotes();

}


// =====================================================
// NEW NOTE
// =====================================================

newNoteBtn.addEventListener(
    "click",
    openNewNote
);


function openNewNote() {

    modalTitle.textContent =
        "Create New Note";


    noteIdInput.value = "";

    titleInput.value = "";

    contentInput.value = "";


    noteModal.classList.add("show");


    setTimeout(
        () => titleInput.focus(),
        100
    );

}


// =====================================================
// CLOSE MODAL
// =====================================================

closeModal.addEventListener(
    "click",
    closeNoteModal
);

cancelBtn.addEventListener(
    "click",
    closeNoteModal
);


noteModal.addEventListener(
    "click",
    function(event) {

        if (
            event.target === noteModal
        ) {

            closeNoteModal();

        }

    }
);


function closeNoteModal() {

    noteModal.classList.remove("show");

}


// =====================================================
// SEARCH
// =====================================================

searchInput.addEventListener(
    "input",
    renderNotes
);


// =====================================================
// ALL NOTES
// =====================================================

allNotesBtn.addEventListener(
    "click",
    function() {

        showingFavorites = false;

        allNotesBtn.classList.add("active");

        favoritesBtn.classList.remove("active");

        renderNotes();

    }
);


// =====================================================
// FAVORITES FILTER
// =====================================================

favoritesBtn.addEventListener(
    "click",
    function() {

        showingFavorites = true;

        favoritesBtn.classList.add("active");

        allNotesBtn.classList.remove("active");

        renderNotes();

    }
);


// =====================================================
// STATUS MESSAGE
// =====================================================

function showStatus(message) {

    statusMessage.textContent =
        message;

}


// =====================================================
// DATE FORMAT
// =====================================================

function formatDate(dateString) {

    if (!dateString) {
        return "Unknown date";
    }


    const date =
        new Date(dateString);


    return date.toLocaleDateString(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );

}


// =====================================================
// SECURITY / HTML ESCAPING
// =====================================================

function escapeHtml(value) {

    return String(value || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


// =====================================================
// START APPLICATION
// =====================================================

loadNotes();