let modalContent = document.querySelector('.modal-content');
let openModal = document.querySelector('.open-modal');
let closeModal = document.querySelector('.close-modal');
let blurBg = document.querySelector('.blur-bg');

// open / close post form
openModal.addEventListener('click', function () {
  modalContent.classList.remove('hidden-modal');
  blurBg.classList.remove('hidden-blur');
});

let closeModalFunction = function () {
  modalContent.classList.add('hidden-modal');
  blurBg.classList.add('hidden-blur');
};

blurBg.addEventListener('click', closeModalFunction);
closeModal.addEventListener('click', closeModalFunction);

document.addEventListener('keydown', function (event) {
  if (event.key === 'Escape' && !modalContent.classList.contains('hidden')) {
    closeModalFunction();
  }
});

const imgPreview = document.getElementById('imgPreview');
const imgPicker = document.getElementById('image');
const fileStatus = document.getElementById('fileStatus');

imgPicker.addEventListener('change', function () {
  const file = imgPicker.files[0];
  const maxSized = 1048576;
  if (file.size > maxSized) {
    fileStatus.style.display = 'block';
  } else {
    fileStatus.style.display = 'none';
    showPreviewImage();
  }
});

function showPreviewImage() {
  const files = imgPicker.files[0];
  if (files) {
    const fileReader = new FileReader();
    fileReader.readAsDataURL(files);
    fileReader.addEventListener('load', function () {
      imgPreview.style.display = 'block';
      imgPreview.innerHTML +=
        '<img style="max-width:250px;" src="' + this.result + '" />';
    });
  }
}
