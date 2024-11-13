
// Function to scroll to specific section
function scrollToSection(sectionId) {
    const section = document.querySelector(sectionId);
    window.scrollTo({
        top: section.offsetTop,
        behavior: "smooth"
    });
}

// Function to toggle the mobile menu (for smaller screens)
function toggleMenu() {
    const navbar = document.getElementById("navbar");
    navbar.classList.toggle("active");
}

// Function to open the modal
function openModal() {
    const modal = document.getElementById("applyModal");
    modal.style.display = "block";
}

// Function to close the modal
function closeModal() {
    const modal = document.getElementById("applyModal");
    modal.style.display = "none";
}

// Event listener for opening the modal when clicking "Apply for Courses" button
const applyButtons = document.querySelectorAll(".btn-apply");
applyButtons.forEach(button => {
    button.addEventListener("click", openModal);
});

// Event listener for closing the modal
const closeModalButton = document.getElementById("closeModal");
closeModalButton.addEventListener("click", closeModal);

// Handling form submission
const applyForm = document.getElementById("applyForm");
applyForm.addEventListener("submit", function (event) {
    event.preventDefault(); // Prevent page reload
    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const course = document.getElementById("course").value;
    
    // For now, just log the form data to the console
    console.log(`Name: ${name}, Email: ${email}, Course: ${course}`);
    
    // Close the modal after form submission
    closeModal();
    alert("Your application has been submitted!");
});

// Event listener for "Learn More" button (smooth scroll to Courses Section)
const learnMoreButton = document.querySelector(".btn-learn-more");
learnMoreButton.addEventListener("click", function() {
    scrollToSection("#courses");  // Change "#courses" to the target section's ID if needed
});
// Initialize scene, camera, and renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 5, 10);

const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById("cityCanvas") });
renderer.setSize(window.innerWidth * 0.6, 500);
document.body.appendChild(renderer.domElement);

// Lighting
const light = new THREE.DirectionalLight(0xffffff, 0.5);
light.position.set(0, 10, 10);
scene.add(light);

// Traffic & Pedestrian arrays
let cars = [];
let pedestrians = [];
let trafficLight;

// Traffic Light States and Duration (milliseconds)
const lightStates = ["green", "yellow", "red"];
let currentLightState = "green";
let lastStateChange = Date.now();

// Function to fetch the traffic light state from the API
async function getTrafficLightState(trafficDensity, pedestrianDensity, greenSpace, timeOfDay) {
    const response = await fetch('http://127.0.0.1:5000/predict', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            traffic_density: trafficDensity,
            pedestrian_density: pedestrianDensity,
            green_space: greenSpace,
            time_of_day: timeOfDay
        }),
    });
    const data = await response.json();
    return data.predicted_state;
}

// Function to update the traffic light state based on AI model prediction
async function updateTrafficLightState() {
    // Fetch real-time values
    const trafficDensity = document.getElementById("trafficDensity").value;
    const pedestrianDensity = document.getElementById("populationDensity").value;
    const greenSpace = document.getElementById("greenSpace").checked ? 1 : 0;
    const timeOfDay = new Date().getHours();  // Get current hour (0-23)

    // Get the traffic light state from the AI model
    const predictedState = await getTrafficLightState(trafficDensity, pedestrianDensity, greenSpace, timeOfDay);

    // Update the traffic light based on the predicted state
    switch (predictedState) {
        case 0:
            trafficLight.state = 'red';
            break;
        case 1:
            trafficLight.state = 'yellow';
            break;
        case 2:
            trafficLight.state = 'green';
            break;
    }

    // Update the colors of the lights
    trafficLight.redLight.material.color.set(trafficLight.state === "red" ? 0xff0000 : 0x330000);
    trafficLight.yellowLight.material.color.set(trafficLight.state === "yellow" ? 0xffff00 : 0x333300);
    trafficLight.greenLight.material.color.set(trafficLight.state === "green" ? 0x00ff00 : 0x003300);
}

// Create traffic light with three colors
function createTrafficLight(position) {
    const poleGeometry = new THREE.CylinderGeometry(0.1, 0.1, 1, 8);
    const poleMaterial = new THREE.MeshLambertMaterial({ color: 0x000000 });
    const pole = new THREE.Mesh(poleGeometry, poleMaterial);
    pole.position.set(position.x, position.y, position.z);
    scene.add(pole);

    const lightGeometry = new THREE.SphereGeometry(0.2, 16, 16);
    
    const redLight = new THREE.Mesh(lightGeometry, new THREE.MeshLambertMaterial({ color: 0xff0000 }));
    redLight.position.set(position.x, position.y + 0.5, position.z);
    scene.add(redLight);

    const yellowLight = new THREE.Mesh(lightGeometry, new THREE.MeshLambertMaterial({ color: 0xffff00 }));
    yellowLight.position.set(position.x, position.y + 0.3, position.z);
    scene.add(yellowLight);

    const greenLight = new THREE.Mesh(lightGeometry, new THREE.MeshLambertMaterial({ color: 0x00ff00 }));
    greenLight.position.set(position.x, position.y + 0.1, position.z);
    scene.add(greenLight);

    trafficLight = { redLight, yellowLight, greenLight, state: "green" };
}

// Function to animate car movement with traffic light control
function animateCars() {
    cars.forEach(car => {
        if (trafficLight.state === "green") {
            car.moving = true;
        } else if (trafficLight.state === "yellow") {
            car.moving = false; // Optionally add a delay for realistic slow down
        } else {
            car.moving = false;
        }

        if (car.moving) {
            car.position.x += 0.05;
            if (car.position.x > 10) car.position.x = -10;
        }
    });
}

// Function to animate pedestrian movement with traffic light control
function animatePedestrians() {
    pedestrians.forEach(pedestrian => {
        pedestrian.moving = (trafficLight.state === "green");

        if (pedestrian.moving) {
            pedestrian.position.x += (Math.random() - 0.5) * 0.02;
            pedestrian.position.z += (Math.random() - 0.5) * 0.02;
        }
    });
}

// Populate cars, pedestrians, and traffic lights initially
for (let i = 0; i < 20; i++) createCar();
for (let i = 0; i < 50; i++) createPedestrian();
createTrafficLight({ x: 0, y: 1, z: 0 });

// Real-Time AI Metrics Update
const metricsContainer = document.getElementById("metricsContainer");
function updateMetrics() {
    const trafficDensity = document.getElementById("trafficDensity").value;
    const populationDensity = document.getElementById("populationDensity").value;
    const greenSpaceChecked = document.getElementById("greenSpace").checked;
    
    metricsContainer.innerHTML = `
        <p>Traffic Density: ${trafficDensity}%</p>
        <p>Population Density: ${populationDensity}%</p>
        <p>Green Space Expanded: ${greenSpaceChecked ? "Yes" : "No"}</p>
    `;
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    
    animateCars();
    animatePedestrians();
    updateTrafficLightState(); // Fetch and update traffic light state from the API
    updateMetrics(); // Update real-time metrics display
    renderer.render(scene, camera);
}

// Event listeners for controls
document.getElementById("trafficDensity").addEventListener("input", (e) => {
    const densityFactor = e.target.value;
    adjustTrafficDensity(densityFactor);
});

document.getElementById("populationDensity").addEventListener("input", (e) => {
    const densityFactor = e.target.value;
    adjustPopulationDensity(densityFactor);
});

document.getElementById("greenSpace").addEventListener("change", () => {
    toggleGreenSpace();
});

function adjustTrafficDensity(density) {
    while (cars.length > density / 10) {
        scene.remove(cars.pop());
    }
    while (cars.length < density / 10) {
        createCar();
    }
}

function adjustPopulationDensity(density) {
    while (pedestrians.length > density / 10) {
        scene.remove(pedestrians.pop());
    }
    while (pedestrians.length < density / 10) {
        createPedestrian();
    }
}

function toggleGreenSpace() {
    document.body.style.backgroundColor = document.getElementById("greenSpace").checked ? "#b8e994" : "#f0f4f8";
}

animate();
