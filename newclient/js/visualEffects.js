function createVisualEffect(type, x, y, angle) {
    switch(type) {
        case EFFECT_TYPES.MUZZLE_FLASH:
            visualEffects.push({
                type: type,
                x: x,
                y: y,
                angle: angle,
                size: 5,
                duration: 120,
                startTime: performance.now(),
                opacity: 0.8
            });
            break;
        // Add other effect type handlers
    }
}

function createHitEffect(type, x, y, particleCount, scale = 1.0) {
    const color = type === EFFECT_TYPES.SPIDER_HIT ? '#ff3333' : '#cc33ff';
    const baseSize = type === EFFECT_TYPES.SPIDER_HIT ? 1.5 : 2;
    const baseSpeed = 0.4;
    const baseDuration = 400;
    
    for (let i = 0; i < particleCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = (0.5 + Math.random() * 1.5) * baseSpeed * scale;
        const size = (baseSize * 0.7 + Math.random() * baseSize * 0.6) * scale;
        const distance = 1 + Math.random() * 4 * scale;
        
        visualEffects.push({
            type: type,
            x: x + Math.cos(angle) * distance,
            y: y + Math.sin(angle) * distance,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size: size,
            color: color,
            duration: baseDuration * (0.7 + Math.random() * 0.6),
            startTime: performance.now(),
            opacity: 0.9
        });
    }
}

function updateVisualEffects() {
    const currentTime = performance.now();
    
    visualEffects = visualEffects.filter(effect => {
        const elapsed = currentTime - effect.startTime;
        return elapsed < effect.duration;
    });

    visualEffects.forEach(effect => {
        if (effect.type === EFFECT_TYPES.SPIDER_HIT || effect.type === EFFECT_TYPES.NEST_HIT) {
            effect.x += effect.vx;
            effect.y += effect.vy;
            effect.vx *= 0.95;
            effect.vy *= 0.95;
            effect.opacity = 1 - (currentTime - effect.startTime) / effect.duration;
            effect.size *= 0.99;
        }
    });
}
