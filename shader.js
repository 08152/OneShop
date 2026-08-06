// ==========================================
// GLOBALE SHADER-SAMMLUNG (Chromebook-safe)
// ==========================================

// 1. Blauer Himmel Shader
const skyVertexShader = `
    precision mediump float;
    varying vec3 vWorldPosition;
    void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        gl_Position = projectionMatrix * viewMatrix * worldPosition;
    }
`;

const skyFragmentShader = `
    precision mediump float;
    varying vec3 vWorldPosition;
    void main() {
        float h = normalize(vWorldPosition).y;
        vec3 skyColor = mix(vec3(0.4, 0.7, 1.0), vec3(0.1, 0.4, 0.8), max(h, 0.0));
        gl_FragColor = vec4(skyColor, 1.0);
    }
`;

// 2. Rote Plattform Gitter-Shader
const floorVertexShader = `
    precision mediump float;
    varying vec2 vUv;
    void main() {
        vUv = uv;
        gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
    }
`;

const floorFragmentShader = `
    precision mediump float;
    varying vec2 vUv;
    void main() {
        vec2 grid = abs(fract(vUv * 40.0 - 0.5) - 0.5) / 0.06;
        float line = min(grid.x, grid.y);
        float c = 1.0 - min(line, 1.0);
        
        vec3 baseColor = vec3(0.8, 0.1, 0.1);
        vec3 lineColor = vec3(0.2, 0.0, 0.0);
        
        gl_FragColor = vec4(mix(baseColor, lineColor, c), 1.0);
    }
`;

// 3. Wabernder Giftgrüner Schleim-Shader
const slimeVertexShader = `
    precision mediump float;
    varying vec2 vUv;
    uniform float uTime;
    void main() {
        vUv = uv;
        vec3 pos = position;
        pos.z += sin(pos.x * 0.05 + uTime) * 1.5;
        gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(pos, 1.0);
    }
`;

const slimeFragmentShader = `
    precision mediump float;
    varying vec2 vUv;
    uniform float uTime;
    void main() {
        float wave = sin(vUv.x * 20.0 + uTime) * cos(vUv.y * 20.0 + uTime);
        vec3 brightSlime = vec3(0.0, 0.9, 0.1);
        vec3 darkSlime = vec3(0.0, 0.4, 0.0);
        vec3 finalColor = mix(darkSlime, brightSlime, (wave + 1.0) * 0.5);
        gl_FragColor = vec4(finalColor, 1.0);
    }
`;

// Uniforms-Verbindung für die Animation
const slimeUniforms = {
    uTime: { value: 0.0 }
};
