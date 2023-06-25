let modalContent = document.querySelector(".modal-content");
let openModal = document.querySelector(".open-modal");
let closeModal = document.querySelector(".close-modal");
let blurBg = document.querySelector(".blur-bg");

// open / close post form
openModal.addEventListener("click", function () {
          modalContent.classList.remove("hidden-modal");
          blurBg.classList.remove("hidden-blur");
});


let closeModalFunction = function () {
          modalContent.classList.add("hidden-modal")
          blurBg.classList.add("hidden-blur")
}

blurBg.addEventListener("click", closeModalFunction);
closeModal.addEventListener("click", closeModalFunction);

document.addEventListener("keydown", function (event) {

          if (event.key === "Escape" && !modalContent.classList.contains("hidden")) {
                    closeModalFunction();
        }
    
});
