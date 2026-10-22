export function getInstructorId() {

    const id = sessionStorage.getItem("instructorId");

    
    return id;
}

export function setInstructorId(id) {
    sessionStorage.setItem("instructorId", id);
}

export function clearInstructorId() {
    sessionStorage.removeItem("instructorId");
}