
// Repeater with slider layout

const cardGap = 10; // Gap between Repeater Cards
const cardWidth = 350; // Repeater card's width
let repeater = $w('#boxRepItemAllCards'); // Repeater item id
let leftSliderBtn = $w('#btnPrev'); // Previous btn
let rightSliderBtn = $w('#btnNext'); // next btn

let repElemsPassed; // elems passed after clicking next
let repElemsLeft = 0; // elems left due to next button click

$w.onReady(async function () {

    const windowSizeInfo = await wixWindowFrontend.getBoundingRect();
    let documentWidth = windowSizeInfo.document.width;
    repElemsPassed = documentWidth / (cardWidth + cardGap);

    // Prev/next button actions
    rightSliderBtn.onClick(() => {
        slideRight();
    });
    leftSliderBtn.onClick(() => {
        slideLeft();
    });

});


// Next card action
function slideRight() {

    if(repElemsPassed>=$w('#repAllCards').data.length){
        return;
    }

    // check for any fractional element
    const compElemsPassed = Math.floor(repElemsPassed);
    const fractionalElem = repElemsPassed - compElemsPassed;
    let moveDistance;
    if (fractionalElem > 0) {
        // if fractional element is there
        moveDistance = (repElemsLeft * cardWidth) + (1 - fractionalElem) * cardWidth + (4*cardGap);
        repElemsPassed = repElemsPassed + (1 - fractionalElem);
        repElemsLeft += (1 - fractionalElem);
    } else {
        // move individual card at a time
        moveDistance = (repElemsLeft * cardWidth) + cardWidth + (4*cardGap);
        repElemsPassed += 1;
        repElemsLeft += 1;
    }

    console.log("next", repElemsPassed, compElemsPassed, fractionalElem, moveDistance);
    console.log("Prev", repElemsLeft, compElemsPassed, fractionalElem, moveDistance);
    wixAnimations.timeline().add(repeater, { x: -(moveDistance), duration: 400, easing: 'easeOutSine' }).play();
    
}

// Prev element action
function slideLeft() {
    if(repElemsLeft<=0){
        return;
    }
    const compElemsPassed = Math.floor(repElemsLeft);
    const fractionalElem = repElemsLeft - compElemsPassed;
    let moveDistance;
    if (fractionalElem > 0) {
        moveDistance = (repElemsLeft * -cardWidth) + (fractionalElem * cardWidth);
        repElemsLeft = repElemsLeft - fractionalElem;
        repElemsPassed -= fractionalElem;
    } else {
        moveDistance = (repElemsLeft * -cardWidth) + cardWidth;
        repElemsLeft -= 1;
        repElemsPassed -= 1;
    }
    console.log("next", repElemsPassed, compElemsPassed, fractionalElem, moveDistance);
    console.log("Prev", repElemsLeft, compElemsPassed, fractionalElem, moveDistance);
    wixAnimations.timeline().add(repeater, { x: moveDistance, duration: 400, easing: 'easeOutSine' }).play();
    
}