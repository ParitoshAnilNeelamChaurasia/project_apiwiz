function saveEntry(entry) {
    let entries = loadEntries();
    // entry checking
    const existingIndex = entries.findIndex(e => e.date === entry.date);
    
    if (existingIndex !== -1) {
        // Replace existing entry
        entries[existingIndex] = entry;
    } 
    else 
    {
        // Add new entry
        entries.push(entry);
    }
    
    localStorage.setItem('moodmate_entries', JSON.stringify(entries));
}

function loadEntries() {
    const entriesJson = localStorage.getItem('moodmate_entries');
    return entriesJson ? JSON.parse(entriesJson) : [];
}

function clearEntries() {
    localStorage.removeItem('moodmate_entries');
}