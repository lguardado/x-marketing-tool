const MAX_CHARS = 280;

const $ = (id) => document.getElementById(id);
const form = $('form');
const ageInput = $('age');
const locationInput = $('location');
const photoInput = $('photo');
const dropzone = $('dropzone');
const copyButton = $('copy');
const shareButton = $('share');

// Audiences in the order they were checked, so the sentence reads the way the user picked them.
let selected = [...document.querySelectorAll('#audiences input:checked')].map((box) => box.value);
let photoUrl = null;

function joinList(items) {
  if (items.length < 2) return items.join('');
  return `${items.slice(0, -1).join(', ')} & ${items.at(-1)}`;
}

function readValues() {
  return {
    age: ageInput.validity.valid ? ageInput.value.trim() : '',
    location: locationInput.value.trim(),
    audience: joinList(selected),
  };
}

// One template feeds both the copied text and the preview; `fill` decides how each value renders.
function compose({ age, location, audience }, fill) {
  return [
    "I'm ", fill(age, 'age'), '.\n\n',
    'Solo founder based in ', fill(location, 'your city'), '.\n\n',
    'Looking to connect with more ', fill(audience, 'people'), '!',
  ];
}

function fillWithPlaceholder(value, placeholder) {
  if (value) return value;
  const span = document.createElement('span');
  span.className = 'placeholder';
  span.textContent = placeholder;
  return span;
}

const currentText = () => compose(readValues(), (value) => value).join('');

function update() {
  const values = readValues();
  const text = currentText();
  const ready = Boolean(values.age && values.location && values.audience) && text.length <= MAX_CHARS;

  $('postText').replaceChildren(...compose(values, fillWithPlaceholder));
  $('count').textContent = `${text.length} / ${MAX_CHARS}`;
  $('count').classList.toggle('over', text.length > MAX_CHARS);
  copyButton.disabled = !ready;
  shareButton.disabled = !ready;
}

function setPhoto(file) {
  if (photoUrl) URL.revokeObjectURL(photoUrl);
  photoUrl = file?.type.startsWith('image/') ? URL.createObjectURL(file) : null;

  const img = $('mediaImg');
  if (photoUrl) img.src = photoUrl;
  else img.removeAttribute('src');

  $('media').hidden = !photoUrl;
  $('removePhoto').hidden = !photoUrl;
  $('photoHint').hidden = !photoUrl;
  $('photoName').textContent = photoUrl ? file.name : '';
  dropzone.classList.toggle('has-photo', Boolean(photoUrl));
  if (!photoUrl) photoInput.value = '';
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const area = Object.assign(document.createElement('textarea'), { value: text });
    document.body.append(area);
    area.select();
    document.execCommand('copy');
    area.remove();
  }
}

form.addEventListener('input', update);
form.addEventListener('submit', (event) => event.preventDefault());
form.addEventListener('change', (event) => {
  const { target } = event;
  if (target.type === 'checkbox') {
    selected = target.checked ? [...selected, target.value] : selected.filter((value) => value !== target.value);
  }
  if (target === photoInput) setPhoto(photoInput.files[0]);
  update();
});

['dragenter', 'dragover'].forEach((type) =>
  dropzone.addEventListener(type, (event) => {
    event.preventDefault();
    dropzone.classList.add('dragging');
  }),
);
dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragging'));
dropzone.addEventListener('drop', (event) => {
  event.preventDefault();
  dropzone.classList.remove('dragging');
  setPhoto(event.dataTransfer.files[0]);
});

$('removePhoto').addEventListener('click', () => setPhoto(null));

copyButton.addEventListener('click', async () => {
  await copyText(currentText());
  copyButton.textContent = 'Copied!';
  setTimeout(() => { copyButton.textContent = 'Copy text'; }, 1500);
});

shareButton.addEventListener('click', () => {
  window.open(`https://x.com/intent/post?text=${encodeURIComponent(currentText())}`, '_blank', 'noopener');
});

update();
