const { performance } = require('perf_hooks');

function runSplice(entities) {
    let dt = 16;
    for (let i = 0; i < entities.length; i++) {
        let e = entities[i];
        if (e.type === 'particle') {
            e.update(dt);
            if (e.life <= 0) {
                entities.splice(i, 1);
                i--;
            }
        }
    }
}

function runSwapPop(entities) {
    let dt = 16;
    for (let i = 0; i < entities.length; i++) {
        let e = entities[i];
        if (e.type === 'particle') {
            e.update(dt);
            if (e.life <= 0) {
                entities[i] = entities[entities.length - 1];
                entities.pop();
                i--;
            }
        }
    }
}

function benchmark() {
    let iterations = 100000;

    // Splice
    let entitiesSplice = [];
    for (let i = 0; i < iterations; i++) {
        entitiesSplice.push({ type: 'particle', life: 0, update: () => {} });
    }
    let startSplice = performance.now();
    runSplice(entitiesSplice);
    let endSplice = performance.now();
    console.log(`Splice took ${endSplice - startSplice} ms`);

    // Swap & Pop
    let entitiesSwapPop = [];
    for (let i = 0; i < iterations; i++) {
        entitiesSwapPop.push({ type: 'particle', life: 0, update: () => {} });
    }
    let startSwapPop = performance.now();
    runSwapPop(entitiesSwapPop);
    let endSwapPop = performance.now();
    console.log(`Swap & Pop took ${endSwapPop - startSwapPop} ms`);
}

benchmark();
