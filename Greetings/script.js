//importing birthyear from localStorage and calculating age
const birthyear = parseInt(localStorage.getItem('birthyear'), 10);
const name = localStorage.getItem('name') || 'Friend';
let age; // Declare age variable

if (!isNaN(birthyear)) {
    const currentYear = new Date().getFullYear();
    age = currentYear - birthyear;
    document.getElementById('result').textContent = `Happy ${age}th Birthday ${name}.`;
} else {
    document.getElementById('result').textContent = "No birth year found.";
}

// ====== COMMON CONFETTI FUNCTION ======
function launchConfetti(x, y, direction, particleCount = 100, spread = 55, velocity = 35) {
    confetti({
        particleCount: particleCount,
        angle: direction === "left" ? 240 : direction === "right" ? 300 : 90,
        spread: spread,
        startVelocity: velocity,
        origin: { x, y },
        colors: ["#03A9F4", "#FF5722", "#FDD835", "#4CAF50", "#E91E63"],
        gravity: 1.2,
        ticks: 200
    });
}

// ====== COMBINED CONFETTI CLICK HANDLER ======
document.querySelector(".confetti-container")?.addEventListener("click", () => {
    // Multiple smaller bursts evenly spaced across the x-axis
    const bursts = 10;
    for (let i = 0; i < bursts; i++) {
        const x = i / (bursts - 1);
        launchConfetti(x, 0, 90, 50, 50, 50);
    }
    // Launch confetti from left and right images
    const leftElem = document.querySelector('.confetti-left');
    const rightElem = document.querySelector('.confetti-right');
    if (leftElem && rightElem) {
        const leftPos = getElementCenterNormalized(leftElem);
        const rightPos = getElementCenterNormalized(rightElem);
        launchConfetti(leftPos.x, leftPos.y, 'right');
        launchConfetti(rightPos.x, rightPos.y, 'left');
    }
});

function getElementCenterNormalized(element) {
    const rect = element.getBoundingClientRect();
    return {
        x: (rect.left + rect.width / 2) / window.innerWidth,
        y: (rect.top + rect.height / 2.5) / window.innerHeight
    };
}

// Dynamic text outputs using calculated age
document.getElementById('output1').textContent = `Dear ${name}.`;

if (age !== undefined) {
    document.getElementById('output2').textContent = `You are ${age} years old now,`;
    if (age >= 18) {
        document.getElementById('output3').textContent = "as an adult, you now have responsibilities";
        document.getElementById('output4').textContent = "that you need to take care of and be more mature? please.";
        document.getElementById('output5').textContent = "or you can just ignore it all and be as childish and a pain in the ass as you can,";
    } else {
        document.getElementById('output3').textContent = "as a kid, have as much fun as you can";
        document.getElementById('output4').textContent = "and enjoy your life to the fullest.";
        document.getElementById('output5').textContent = "as after a point you might not be able to have fun or do what you want,";
    }
} else {
    document.getElementById('output2').textContent = 'You are some years old now,';
}

document.getElementById('output6').textContent = "either way, Happy-Birthday once again, and may all your dreams come true!";

// ====== PAGE SYSTEM & OTHER EFFECTS ======
let currentPage = 'home';

function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');

    document.querySelectorAll('.nav-links a').forEach(link => {
        link.classList.toggle('active', link.getAttribute('onclick') === `showPage('${pageId}')`);
    });
    
    currentPage = pageId;
    const footer = document.getElementById('footer');
    document.getElementById(pageId).appendChild(footer);
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

window.addEventListener('DOMContentLoaded', () => {
    const footer = document.getElementById('footer');
    document.getElementById('home').appendChild(footer);
});

document.addEventListener('mousemove', (e) => {
    const shapes = document.querySelectorAll('.shape');
    const x = e.clientX / window.innerWidth;
    const y = e.clientY / window.innerHeight;
    shapes.forEach((shape, index) => {
        const speed = (index + 1) * 0.5;
        shape.style.transform = `translate(${(x - 0.5) * speed * 20}px, ${(y - 0.5) * speed * 20}px)`;
    });
});

window.addEventListener('scroll', () => {
    const speed = window.pageYOffset * 0.5;
    document.querySelector('.bg-shapes').style.transform = `translateY(${speed}px)`;
});

document.querySelectorAll('.glass').forEach(element => {
    element.addEventListener('click', function(e) {
        const ripple = document.createElement('div');
        const rect = this.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;
        ripple.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            left: ${x}px;
            top: ${y}px;
            background: rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            transform: scale(0);
            animation: ripple 0.6s linear;
            pointer-events: none;
            z-index: 1000;
        `;
        if (getComputedStyle(this).position === 'static') {
            this.style.position = 'relative';
        }
        this.appendChild(ripple);
        setTimeout(() => ripple.remove(), 600);
    });
});

const style = document.createElement('style');
style.textContent = `
    @keyframes ripple {
        to { transform: scale(4); opacity: 0; }
    }
`;
document.head.appendChild(style);

document.querySelector('form').addEventListener('submit', function(e) {
    e.preventDefault();
    const successMsg = document.createElement('div');
    successMsg.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(46, 204, 113, 0.9);
        color: white;
        padding: 20px 40px;
        border-radius: 10px;
        backdrop-filter: blur(20px);
        z-index: 10000;
        animation: fadeIn 0.3s ease;
    `;
    successMsg.textContent = 'Message sent successfully! We\'ll get back to you soon.';
    document.body.appendChild(successMsg);
    setTimeout(() => successMsg.remove(), 3000);
    this.reset();
});

const fadeStyle = document.createElement('style');
fadeStyle.textContent = `
    @keyframes fadeIn {
        from { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
        to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
    }
`;
document.head.appendChild(fadeStyle);

