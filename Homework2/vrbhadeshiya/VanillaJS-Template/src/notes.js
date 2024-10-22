var counter = 0;

export const Notes = (msg) => (`
    <div class='card' id='note-card'>
        <div class="card-content">
            <h5>${msg}</h5>
        </div>
    </div>
`)

// Mount the counter for reusability with different elements
export function mountCounter(element) {
    const setCounter = (count) => {
      counter = count;
      element.innerHTML = `Clicked this ${counter} times`;
    }
    element.addEventListener('click', () => setCounter(counter + 1));
}

// Optional: In case you want to allow dynamic text updates
export function updateNoteMessage(element, newMessage) {
    element.querySelector('h5').innerText = newMessage;
}
