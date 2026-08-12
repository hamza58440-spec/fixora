/* =========================================================
   FIXORA SERVICES
========================================================= */

const services = [
  ['🚰','Plumber','Home','Water, pipes & leakage repair'],
  ['⚡','Electrician','Home','Wiring, switches & electrical repair'],
  ['🪚','Carpenter','Home','Furniture, doors & wood work'],
  ['🧱','Mason / Civil Work','Home','Walls, brick & construction'],
  ['🎨','Painter','Home','Home & office painting'],
  ['⬜','Tile & Marble','Home','Tile and marble work'],
  ['🏠','Gypsum / Ceiling','Home','False ceiling & gypsum'],
  ['💧','Waterproofing','Home','Roof & bathroom waterproofing'],
  ['🔐','Locksmith','Home','Locks and keys'],
  ['🛋️','Furniture Repair','Home','Furniture fixing'],

  ['❄️','AC Repair','Appliances','AC service & installation'],
  ['🧊','Refrigerator Repair','Appliances','Fridge repair'],
  ['🧺','Washing Machine','Appliances','Washing machine repair'],
  ['🍲','Microwave Repair','Appliances','Microwave service'],
  ['🚿','Geyser Repair','Appliances','Geyser service'],

  ['🚗','Car Mechanic','Auto','Car inspection & repair'],
  ['🏍️','Bike Mechanic','Auto','Motorbike repair'],
  ['❄️','Car AC','Auto','Car AC service'],
  ['🔋','Battery Service','Auto','Battery check & replacement'],
  ['🛞','Tyre / Puncture','Auto','Tyre repair'],
  ['🧽','Car Washing','Auto','Car wash & detailing'],
  ['🛢️','Oil Change','Auto','Oil & filter service'],

  ['🪟','Glass Work','Glass','Glass cutting, fitting & replacement'],
  ['🏠','Aluminium Work','Glass','Aluminium doors, windows & frames'],
  ['🚿','Shower Glass','Glass','Shower enclosure glass'],
  ['🪟','Windows & Doors','Glass','Glass/aluminium windows & doors'],

  ['🧹','Home Cleaning','Cleaning','Routine home cleaning'],
  ['✨','Deep Cleaning','Cleaning','Full deep cleaning'],
  ['🍳','Kitchen Cleaning','Cleaning','Kitchen cleaning'],
  ['🚿','Bathroom Cleaning','Cleaning','Bathroom cleaning'],
  ['🛋️','Sofa Cleaning','Cleaning','Sofa cleaning'],
  ['🧶','Carpet Cleaning','Cleaning','Carpet wash'],
  ['💧','Water Tank Cleaning','Cleaning','Tank cleaning'],
  ['🏢','Office Cleaning','Cleaning','Office cleaning'],

  ['📦','Home Shifting','Moving','House shifting'],
  ['🚚','Loading / Unloading','Moving','Moving labor'],
  ['📦','Small Delivery','Moving','Local pickup & delivery'],

  ['💻','Computer Repair','Tech','PC repair'],
  ['💻','Laptop Repair','Tech','Laptop diagnosis'],
  ['🖨️','Printer Repair','Tech','Printer service'],
  ['📹','CCTV Installation','Tech','CCTV setup'],
  ['📶','Wi-Fi Setup','Tech','Router & network setup'],
  ['📱','Mobile Repair','Tech','Phone repair'],

  ['🌱','Gardening','Outdoor','Garden maintenance'],
  ['🐜','Pest Control','Outdoor','Pest treatment'],
  ['☀️','Solar Panel Cleaning','Outdoor','Solar panel cleaning'],
  ['☀️','Solar Installation','Outdoor','Solar installation'],
  ['⚙️','Generator Repair','Outdoor','Generator service'],
  ['🔥','Welding Work','Outdoor','Welding & metal work']
];


/* =========================================================
   SERVICE LIST
========================================================= */

const list = document.getElementById('serviceList');
const select = document.getElementById('serviceSelect');

function render(items = services) {
  if (!list) return;

  list.innerHTML = items.map(function(s) {
    const safeName = String(s[1]).replace(/'/g, "\\'");

    return `
      <article class="service-item">
        <div style="font-size:28px">${s[0]}</div>
        <h3>${s[1]}</h3>
        <p style="color:#71829b;font-size:12px;margin-top:5px">
          ${s[3]}
        </p>
        <button onclick="book('${safeName}')">
          Book Now
        </button>
      </article>
    `;
  }).join('');
}

render();


if (select) {
  services.forEach(function(s) {
    const o = document.createElement('option');

    o.value = s[1];
    o.textContent = s[1];

    select.appendChild(o);
  });
}


/* =========================================================
   SERVICE FILTER
========================================================= */

function filterCategory(cat) {
  const items = services.filter(function(s) {
    return s[2] === cat;
  });

  render(items);

  const serviceList = document.getElementById('serviceList');

  if (serviceList) {
    serviceList.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  }
}


function showAll() {
  render();

  const serviceList = document.getElementById('serviceList');

  if (serviceList) {
    serviceList.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  }
}


function searchServices() {
  const input = document.getElementById('searchInput');

  if (!input) return;

  const q = input.value.toLowerCase().trim();

  const items = services.filter(function(s) {
    return (
      s[1] + ' ' +
      s[3] + ' ' +
      s[2]
    ).toLowerCase().includes(q);
  });

  render(items);

  const serviceList = document.getElementById('serviceList');

  if (serviceList) {
    serviceList.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  }
}


function book(service) {
  if (select) {
    select.value = service;
  }

  const booking = document.getElementById('booking');

  if (booking) {
    booking.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  }
}


/* =========================================================
   WHATSAPP BOOKING
========================================================= */

function whatsappBooking() {
  const text = encodeURIComponent(
    'Hello Fixora! I want to book a service.'
  );

  window.open(
    'https://wa.me/923207180728?text=' + text,
    '_blank'
  );
}


/* =========================================================
   BOOKINGS
========================================================= */

const BOOKING_KEY = 'fixoraBookings';


async function getBookings() {
  const token = localStorage.getItem('fixoraToken');

  if (!token) {
    return [];
  }

  try {
    const response = await fetch('/api/bookings', {
      headers: {
        'Authorization': 'Bearer ' + token
      }
    });

    if (!response.ok) {
      return [];
    }

    const rows = await response.json();

    return rows.map(function(b) {
      return Object.assign({}, b, {
        date: b.date || b.booking_date,
        time: b.time || b.booking_time,
        status: String(b.status || 'Pending')
          .replace(/^pending$/i, 'Pending')
      });
    });

  } catch (error) {
    console.error('getBookings error:', error);
    return [];
  }
}


function saveBookings(items) {
  localStorage.setItem(
    BOOKING_KEY,
    JSON.stringify(items)
  );
}


/* =========================================================
   CUSTOMER BOOKING
========================================================= */

const bookingForm = document.getElementById('bookingForm');

if (bookingForm) {

  bookingForm.addEventListener('submit', async function(e) {

    e.preventDefault();

    const token = localStorage.getItem('fixoraToken');

    if (!token) {
      alert('Please login first.');
      openAuth('login');
      return;
    }

    const booking = {
      service:
        document.getElementById('serviceSelect')?.value || '',

      area:
        document.getElementById('area')?.value.trim() || '',

      date:
        document.getElementById('date')?.value || '',

      time:
        document.getElementById('time')?.value || '',

      details:
        document.getElementById('details')?.value.trim() || ''
    };


    if (
      !booking.service ||
      !booking.area ||
      !booking.date ||
      !booking.time
    ) {
      alert('Please fill all required fields.');
      return;
    }


    try {

      const response = await fetch('/api/bookings', {
        method: 'POST',

        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        },

        body: JSON.stringify(booking)
      });


      const data = await response.json();


      if (!response.ok) {
        alert(
          data.error ||
          'Booking could not be created.'
        );
        return;
      }


      alert(
        'Booking created successfully! Booking ID: ' +
        data.id
      );


      const message = encodeURIComponent(
        'Hello Fixora! New Booking\n' +
        'Booking ID: ' + data.id + '\n' +
        'Service: ' + data.service + '\n' +
        'Area: ' + data.area + '\n' +
        'Date: ' + (data.booking_date || '') + '\n' +
        'Time: ' + (data.booking_time || '') + '\n' +
        'Details: ' + (data.details || 'N/A')
      );


      window.open(
        'https://wa.me/923207180728?text=' + message,
        '_blank'
      );


      this.reset();

      await renderDashboard();


      const dash =
        document.getElementById('dashboard');

      if (dash) {
        dash.scrollIntoView({
          behavior: 'smooth'
        });
      }

    } catch (error) {

      console.error('Booking error:', error);

      alert(
        'Unable to connect to Fixora server.'
      );
    }

  });
}


/* =========================================================
   AUTH MODAL
========================================================= */

/*
   IMPORTANT:
   We store the auth mode directly instead of trying
   to detect it from the modal title.
*/

window.fixoraAuthMode = 'login';


function openAuth(type) {

  window.fixoraAuthMode = type;


  const modal =
    document.getElementById('modal');

  const title =
    document.getElementById('modalTitle');

  const text =
    document.getElementById('modalText');


  if (!modal || !title || !text) {
    return;
  }


  if (type === 'provider') {

    title.textContent =
      'Join Fixora as a Provider';

    text.textContent =
      'Create your professional account and start receiving service requests.';

  } else if (type === 'signup') {

    title.textContent =
      'Create Customer Account';

    text.textContent =
      'Sign up to manage bookings and reviews.';

  } else {

    title.textContent =
      'Welcome Back';

    text.textContent =
      'Log in to your Fixora account.';
  }


  modal.style.display = 'grid';
}


function openProviderAuth() {
  window.fixoraAuthMode = 'provider';
  openAuth('provider');
}


function closeModal() {

  const modal =
    document.getElementById('modal');

  if (modal) {
    modal.style.display = 'none';
  }
}


const mainModal =
  document.getElementById('modal');


if (mainModal) {

  mainModal.addEventListener(
    'click',
    function(e) {

      if (e.target.id === 'modal') {
        closeModal();
      }

    }
  );
}


/* =========================================================
   FIND PROVIDER CNIC FIELD
========================================================= */

/*
   This is the main CNIC fix.

   The code checks:
   1. Common IDs
   2. Common names
   3. Placeholder
   4. Inputs inside auth form
   5. Inputs inside modal
   6. Any input containing "cnic" / "nic"
   7. A 13-digit value

   So even if your HTML uses a different CNIC ID,
   the provider CNIC will still be detected.
*/

function getProviderCnicElement() {

  const possibleIds = [
    'authCnic',
    'providerCnic',
    'cnic',
    'authCNIC',
    'providerCNIC',
    'CNIC',
    'authNIC',
    'providerNIC',
    'nic',
    'NIC'
  ];


  for (const id of possibleIds) {

    const element =
      document.getElementById(id);

    if (element) {
      return element;
    }
  }


  const selectors = [
    '#authForm input[name="cnic"]',
    '#authForm input[name="CNIC"]',
    '#authForm input[name="nic"]',
    '#authForm input[name="NIC"]',
    '#authForm input[placeholder*="CNIC" i]',
    '#authForm input[placeholder*="NIC" i]',
    '#modal input[name="cnic"]',
    '#modal input[name="CNIC"]',
    '#modal input[name="nic"]',
    '#modal input[name="NIC"]',
    '#modal input[placeholder*="CNIC" i]',
    '#modal input[placeholder*="NIC" i]'
  ];


  for (const selector of selectors) {

    try {

      const element =
        document.querySelector(selector);

      if (element) {
        return element;
      }

    } catch (error) {
      console.error(error);
    }
  }


  const allInputs =
    document.querySelectorAll(
      '#authForm input, #modal input'
    );


  for (const input of allInputs) {

    const text = (
      (input.id || '') + ' ' +
      (input.name || '') + ' ' +
      (input.placeholder || '') +
      ' ' +
      (input.getAttribute('aria-label') || '')
    ).toLowerCase();


    if (
      text.includes('cnic') ||
      text.includes('nic')
    ) {
      return input;
    }
  }


  /*
     Final fallback:
     If the form contains a 13-digit value,
     treat that input as CNIC.
  */

  for (const input of allInputs) {

    const value =
      String(input.value || '')
        .replace(/[-\s]/g, '');


    if (/^\d{13}$/.test(value)) {
      return input;
    }
  }


  return null;
}


/* =========================================================
   AUTH FORM
========================================================= */

const authForm =
  document.getElementById('authForm');


if (authForm) {

  authForm.addEventListener(
    'submit',
    async function(e) {

      e.preventDefault();


      const nameEl =
        document.getElementById('authName');


      const phoneEl =
        document.getElementById('authPhone');


      const passwordEl =
        document.getElementById('authPassword');


      const cnicEl =
        getProviderCnicElement();


      const name =
        nameEl
          ? nameEl.value.trim()
          : '';


      const phone =
        phoneEl
          ? phoneEl.value.trim()
          : '';


      const password =
        passwordEl
          ? passwordEl.value
          : '';


      /*
         IMPORTANT:
         Always read CNIC directly from the actual input.
      */

      const cnicRaw =
        cnicEl
          ? String(cnicEl.value || '').trim()
          : '';


      const cnic =
        cnicRaw.replace(/[-\s]/g, '');


      /*
         IMPORTANT:
         Use the stored auth mode.
         Do NOT depend on modal title text.
      */

      const authMode =
        window.fixoraAuthMode || 'login';


      const isProvider =
        authMode === 'provider';


      const isSignup =
        isProvider ||
        authMode === 'signup';


      /* -----------------------------------------
         PROVIDER VALIDATION
      ----------------------------------------- */

      if (isProvider) {

        if (!name) {
          alert('Please enter your name.');
          return;
        }


        if (!phone) {
          alert('Please enter your phone number.');
          return;
        }


        if (!cnic) {
          alert(
            'CNIC is required for provider registration.'
          );
          return;
        }


        if (!/^\d{13}$/.test(cnic)) {

          alert(
            'Please enter a valid 13-digit CNIC.'
          );

          return;
        }


        if (!password) {
          alert('Please enter your password.');
          return;
        }

      }


      /* -----------------------------------------
         CUSTOMER VALIDATION
      ----------------------------------------- */

      if (!isProvider) {

        if (
          !name &&
          isSignup
        ) {

          alert(
            'Please enter your name.'
          );

          return;
        }


        if (!phone) {

          alert(
            'Please enter your phone number.'
          );

          return;
        }


        if (!password) {

          alert(
            'Please enter your password.'
          );

          return;
        }
      }


      /* -----------------------------------------
         REQUEST BODY
      ----------------------------------------- */

      let requestBody;


      if (isSignup) {

        requestBody = {
          name: name,
          phone: phone,
          password: password,
          role: isProvider
            ? 'provider'
            : 'customer'
        };


        /*
           THIS IS THE IMPORTANT FIX.
           CNIC is explicitly included for providers.
        */

        if (isProvider) {
          requestBody.cnic = cnic;
        }

      } else {

        requestBody = {
          phone: phone,
          password: password
        };
      }


      console.log(
        'Fixora auth request:',
        {
          mode: authMode,
          role: requestBody.role,
          hasCNIC:
            Boolean(requestBody.cnic),
          cnicLength:
            requestBody.cnic
              ? requestBody.cnic.length
              : 0
        }
      );


      /* -----------------------------------------
         SEND REQUEST
      ----------------------------------------- */

      try {

        const endpoint =
          isSignup
            ? '/api/auth/signup'
            : '/api/auth/login';


        const response =
          await fetch(
            endpoint,
            {
              method: 'POST',

              headers: {
                'Content-Type':
                  'application/json'
              },

              body:
                JSON.stringify(requestBody)
            }
          );


        let data = {};

        try {
          data = await response.json();
        } catch {
          data = {};
        }


        if (!response.ok) {

          console.error(
            'Fixora authentication failed:',
            data
          );


          alert(
            data.error ||
            'Something went wrong.'
          );

          return;
        }


        /* -----------------------------------------
           SAVE LOGIN
        ----------------------------------------- */

        if (data.token) {

          localStorage.setItem(
            'fixoraToken',
            data.token
          );
        }


        if (data.user) {

          localStorage.setItem(
            'fixoraUser',
            JSON.stringify(data.user)
          );
        }


        alert(
          isSignup
            ? 'Account created successfully!'
            : 'Login successful!'
        );


        closeModal();


        authForm.reset();


        /*
           Reset mode after successful auth.
        */

        window.fixoraAuthMode = 'login';


        /* -----------------------------------------
           REFRESH DASHBOARDS
        ----------------------------------------- */

        if (
          typeof renderDashboard ===
          'function'
        ) {

          await renderDashboard();
        }


        if (
          isProvider &&
          typeof renderProviderBookings ===
          'function'
        ) {

          await renderProviderBookings();
        }


        applyRoleSecurity();


      } catch (error) {

        console.error(
          'Authentication error:',
          error
        );


        alert(
          'Unable to connect to Fixora server.'
        );
      }

    }
  );
}


/* =========================================================
   CUSTOMER DASHBOARD
========================================================= */

async function renderDashboard() {

  const box =
    document.getElementById(
      'bookingDashboard'
    );


  if (!box) {
    return;
  }


  const items =
    await getBookings();


  if (!items.length) {

    box.innerHTML = `
      <div class="empty-bookings">
        <div>📋</div>
        <h3>No bookings yet</h3>
        <p>
          Your service requests will appear here.
        </p>
      </div>
    `;

    return;
  }


  box.innerHTML =
    items.map(function(b) {

      const cls =
        String(b.status)
          .toLowerCase()
          .replace(/\s+/g, '-');


      return `
        <article class="booking-card-item">

          <div class="booking-top">

            <div>

              <span class="booking-id">
                ${b.id}
              </span>

              <h3>
                ${b.service}
              </h3>

            </div>

            <span class="status ${cls}">
              ${b.status}
            </span>

          </div>


          <div class="booking-meta">

            <span>
              📅 ${b.date || ''}
            </span>

            <span>
              ⏰ ${b.time || ''}
            </span>

            <span>
              📍 ${b.area || ''}
            </span>

          </div>


          ${
            b.details
              ? `
                <p class="booking-details">
                  ${b.details}
                </p>
              `
              : ''
          }


          <div class="booking-actions">

            ${
              b.status === 'Pending'
                ? `
                  <button
                    class="cancel-btn"
                    onclick="cancelBooking('${b.id}')">
                    Cancel
                  </button>
                `
                : ''
            }


            ${
              b.status === 'Completed' &&
              !b.rating
                ? `
                  <button
                    onclick="openReview('${b.id}')">
                    ⭐ Rate Service
                  </button>
                `
                : ''
            }


            ${
              b.rating
                ? `
                  <span class="review-done">
                    ★★★★★ ${b.rating}/5
                  </span>
                `
                : ''
            }

          </div>

        </article>
      `;

    }).join('');
}


/* =========================================================
   CANCEL BOOKING
========================================================= */

async function cancelBooking(id) {

  if (
    !confirm(
      'Cancel this booking?'
    )
  ) {
    return;
  }


  const token =
    localStorage.getItem(
      'fixoraToken'
    );


  try {

    const response =
      await fetch(
        '/api/bookings/' +
        encodeURIComponent(id) +
        '/cancel',
        {
          method: 'PATCH',

          headers: {
            'Authorization':
              'Bearer ' + token
          }
        }
      );


    const data =
      await response.json();


    if (!response.ok) {

      alert(
        data.error ||
        'Booking could not be cancelled.'
      );

      return;
    }


    await renderDashboard();


  } catch (e) {

    console.error(e);

    alert(
      'Unable to connect to Fixora server.'
    );
  }
}


/* =========================================================
   REVIEWS
========================================================= */

function openReview(id) {

  window._fixoraReviewId =
    String(id);

  window._fixoraRating = 0;


  document
    .querySelectorAll(
      '#ratingPicker button'
    )
    .forEach(function(btn) {

      btn.classList.remove(
        'selected'
      );

    });


  const reviewText =
    document.getElementById(
      'reviewText'
    );


  if (reviewText) {
    reviewText.value = '';
  }


  const modal =
    document.getElementById(
      'reviewModal'
    );


  if (modal) {
    modal.style.display = 'grid';
  }
}


function closeReview() {

  const modal =
    document.getElementById(
      'reviewModal'
    );


  if (modal) {
    modal.style.display = 'none';
  }
}


document
  .querySelectorAll(
    '#ratingPicker button'
  )
  .forEach(function(btn) {

    btn.addEventListener(
      'click',
      function() {

        window._fixoraRating =
          Number(
            btn.dataset.rating
          );


        document
          .querySelectorAll(
            '#ratingPicker button'
          )
          .forEach(
            function(x) {

              x.classList.toggle(
                'selected',
                Number(
                  x.dataset.rating
                ) <=
                window._fixoraRating
              );

            }
          );

      }
    );

  });


async function submitReview() {

  if (!window._fixoraRating) {

    alert(
      'Please select a rating.'
    );

    return;
  }


  const token =
    localStorage.getItem(
      'fixoraToken'
    );


  const reviewEl =
    document.getElementById(
      'reviewText'
    );


  try {

    const response =
      await fetch(
        '/api/bookings/' +
        encodeURIComponent(
          window._fixoraReviewId
        ) +
        '/review',
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json',

            'Authorization':
              'Bearer ' + token
          },

          body: JSON.stringify({
            rating:
              window._fixoraRating,

            review:
              reviewEl
                ? reviewEl.value.trim()
                : ''
          })
        }
      );


    const data =
      await response.json();


    if (!response.ok) {

      alert(
        data.error ||
        'Review could not be saved.'
      );

      return;
    }


    closeReview();

    await renderDashboard();


    alert(
      'Thank you for your review!'
    );


  } catch (e) {

    console.error(e);

    alert(
      'Unable to connect to Fixora server.'
    );
  }
}


/* =========================================================
   PROVIDER DASHBOARD
========================================================= */

function toggleProviderMode() {

  const checkbox =
    document.getElementById(
      'providerMode'
    );


  if (!checkbox) {
    return;
  }


  const on =
    checkbox.checked;


  const locked =
    document.getElementById(
      'providerLocked'
    );


  const panel =
    document.getElementById(
      'providerPanel'
    );


  if (locked) {

    locked.style.display =
      on
        ? 'none'
        : 'block';
  }


  if (panel) {

    panel.style.display =
      on
        ? 'block'
        : 'none';
  }


  if (on) {
    renderProviderBookings();
  }
}


async function populateProviderServices() {

  const select =
    document.getElementById(
      'providerServiceFilter'
    );


  if (!select) {
    return;
  }


  const existing =
    new Set(
      Array.from(
        select.options
      ).map(function(o) {
        return o.value;
      })
    );


  const bookings =
    await getBookings();


  bookings.forEach(
    function(b) {

      if (
        b.service &&
        !existing.has(b.service)
      ) {

        const o =
          document.createElement(
            'option'
          );


        o.value =
          b.service;


        o.textContent =
          b.service;


        select.appendChild(o);


        existing.add(
          b.service
        );
      }

    }
  );
}


async function renderProviderBookings() {

  const box =
    document.getElementById(
      'providerBookings'
    );


  if (!box) {
    return;
  }


  const userRaw =
    localStorage.getItem(
      'fixoraUser'
    );


  let user = null;


  try {

    user =
      userRaw
        ? JSON.parse(userRaw)
        : null;

  } catch {

    user = null;
  }


  if (
    !user ||
    user.role !== 'provider'
  ) {

    box.innerHTML = `
      <div class="empty-bookings">
        <div>🔐</div>
        <h3>Provider login required</h3>
        <p>
          Please login with your provider account.
        </p>
      </div>
    `;

    return;
  }


  await populateProviderServices();


  const filter =
    document.getElementById(
      'providerServiceFilter'
    )?.value || 'All';


  const allItems =
    await getBookings();


  const items =
    allItems.filter(function(b) {

      return (
        filter === 'All' ||
        b.service === filter
      );

    });


  const pending =
    document.getElementById(
      'providerPending'
    );


  const accepted =
    document.getElementById(
      'providerAccepted'
    );


  const completed =
    document.getElementById(
      'providerCompleted'
    );


  if (pending) {

    pending.textContent =
      items.filter(function(b) {

        return (
          b.status === 'Pending' ||
          b.status === 'pending'
        );

      }).length;
  }


  if (accepted) {

    accepted.textContent =
      items.filter(function(b) {

        return [
          'Accepted',
          'accepted',
          'On the Way'
        ].includes(b.status);

      }).length;
  }


  if (completed) {

    completed.textContent =
      items.filter(function(b) {

        return (
          b.status === 'Completed' ||
          b.status === 'completed'
        );

      }).length;
  }


  if (!items.length) {

    box.innerHTML = `
      <div class="empty-bookings">
        <div>📭</div>
        <h3>No service requests</h3>
        <p>
          Customer requests will appear here
          after a booking is created.
        </p>
      </div>
    `;

    return;
  }


  box.innerHTML =
    items.map(function(b) {

      let actions = '';


      if (
        b.status === 'Pending' ||
        b.status === 'pending'
      ) {

        actions = `
          <button
            onclick="providerUpdateBooking(
              '${b.id}',
              'Accepted'
            )">
            ✓ Accept
          </button>

          <button
            class="cancel-btn"
            onclick="providerUpdateBooking(
              '${b.id}',
              'Cancelled'
            )">
            Reject
          </button>
        `;

      } else if (
        b.status === 'Accepted'
      ) {

        actions = `
          <button
            onclick="providerUpdateBooking(
              '${b.id}',
              'On the Way'
            )">
            🚗 On the Way
          </button>
        `;

      } else if (
        b.status === 'On the Way'
      ) {

        actions = `
          <button
            onclick="providerUpdateBooking(
              '${b.id}',
              'Completed'
            )">
            ✓ Complete Job
          </button>
        `;
      }


      const statusClass =
        String(
          b.status || ''
        )
          .toLowerCase()
          .replace(/\s+/g, '-');


      return `
        <article class="booking-card-item">

          <div class="booking-top">

            <div>

              <span class="booking-id">
                ${b.id}
              </span>

              <h3>
                ${b.service}
              </h3>

              <p class="provider-customer">
                Customer:
                ${b.name || 'Customer'}
              </p>

            </div>


            <span class="status ${statusClass}">
              ${b.status}
            </span>

          </div>


          <div class="booking-meta">

            <span>
              📅
              ${b.booking_date || b.date || ''}
            </span>

            <span>
              ⏰
              ${b.booking_time || b.time || ''}
            </span>

            <span>
              📍
              ${b.area || ''}
            </span>

          </div>


          ${
            b.details
              ? `
                <p class="booking-details">
                  ${b.details}
                </p>
              `
              : ''
          }


          <div class="booking-actions">
            ${actions}
          </div>

        </article>
      `;

    }).join('');
}


async function providerUpdateBooking(
  id,
  status
) {

  const token =
    localStorage.getItem(
      'fixoraToken'
    );


  try {

    const response =
      await fetch(
        '/api/bookings/' +
        encodeURIComponent(id) +
        '/status',
        {
          method: 'PATCH',

          headers: {
            'Content-Type':
              'application/json',

            'Authorization':
              'Bearer ' + token
          },

          body:
            JSON.stringify({
              status: status
            })
        }
      );


    const data =
      await response.json();


    if (!response.ok) {

      alert(
        data.error ||
        'Booking status could not be updated.'
      );

      return;
    }


    await renderProviderBookings();

    await renderDashboard();


  } catch (e) {

    console.error(e);

    alert(
      'Unable to connect to Fixora server.'
    );
  }
}


/* =========================================================
   ADMIN
========================================================= */

const ADMIN_SERVICE_KEY =
  'fixoraAdminServices';


const defaultAdminServices = [
  'Plumber',
  'Electrician',
  'Carpenter',
  'Painter',
  'AC Repair',
  'Refrigerator Repair',
  'Washing Machine Repair',
  'Car Mechanic',
  'Bike Mechanic',
  'Glass Work',
  'Aluminium Work',
  'Home Cleaning',
  'Deep Cleaning',
  'Sofa Cleaning',
  'Home Shifting',
  'Small Delivery',
  'Laptop Repair',
  'CCTV Installation',
  'Wi-Fi Setup',
  'Gardening',
  'Pest Control',
  'Solar Installation',
  'Generator Repair',
  'Welding Work'
];


function getAdminServices() {

  try {

    const saved =
      JSON.parse(
        localStorage.getItem(
          ADMIN_SERVICE_KEY
        )
      );


    return Array.isArray(saved) &&
      saved.length
      ? saved
      : defaultAdminServices.slice();


  } catch (e) {

    return defaultAdminServices.slice();
  }
}


function saveAdminServices(x) {

  localStorage.setItem(
    ADMIN_SERVICE_KEY,
    JSON.stringify(x)
  );
}


async function toggleAdmin() {

  const panel =
    document.getElementById(
      'adminPanel'
    );


  const locked =
    document.getElementById(
      'adminLocked'
    );


  if (!panel || !locked) {
    return;
  }


  const rawUser =
    localStorage.getItem(
      'fixoraUser'
    );


  let user = null;


  try {

    user =
      rawUser
        ? JSON.parse(rawUser)
        : null;

  } catch {

    user = null;
  }


  if (
    !user ||
    user.role !== 'admin'
  ) {

    alert(
      'Admin access only.'
    );

    return;
  }


  const open =
    panel.style.display === 'none';


  panel.style.display =
    open
      ? 'block'
      : 'none';


  locked.style.display =
    open
      ? 'none'
      : 'block';


  if (open) {
    await renderAdmin();
  }
}


async function renderAdmin() {

  const items =
    await getBookings();


  const bookingsCount =
    document.getElementById(
      'adminBookings'
    );


  const pendingCount =
    document.getElementById(
      'adminPending'
    );


  const completedCount =
    document.getElementById(
      'adminCompleted'
    );


  const servicesCount =
    document.getElementById(
      'adminServices'
    );


  if (bookingsCount) {

    bookingsCount.textContent =
      items.length;
  }


  if (pendingCount) {

    pendingCount.textContent =
      items.filter(function(b) {

        return (
          String(b.status)
            .toLowerCase() ===
          'pending'
        );

      }).length;
  }


  if (completedCount) {

    completedCount.textContent =
      items.filter(function(b) {

        return (
          String(b.status)
            .toLowerCase() ===
          'completed'
        );

      }).length;
  }


  const services =
    getAdminServices();


  if (servicesCount) {

    servicesCount.textContent =
      services.length;
  }


  const list =
    document.getElementById(
      'adminBookingsList'
    );


  if (list) {

    list.innerHTML =
      items.length
        ? items.map(function(b) {

            const statusClass =
              String(b.status)
                .toLowerCase()
                .replace(/\s+/g, '-');


            return `
              <div class="admin-row">

                <div>

                  <b>
                    ${b.id}
                  </b>

                  <strong>
                    ${b.service}
                  </strong>

                  <small>
                    ${b.name || 'Customer'}
                    ·
                    ${b.area || ''}
                    ·
                    ${b.date || ''}
                    ${b.time || ''}
                  </small>

                </div>

                <span
                  class="status ${statusClass}">
                  ${b.status}
                </span>

              </div>
            `;

          }).join('')

        : `
          <p class="admin-empty">
            No bookings yet.
          </p>
        `;
  }


  const serviceList =
    document.getElementById(
      'adminServicesList'
    );


  if (serviceList) {

    serviceList.innerHTML =
      services.map(function(s, i) {

        return `
          <div class="service-admin-row">

            <span>
              🔧 ${s}
            </span>

            <button
              onclick="removeAdminService(${i})">
              Remove
            </button>

          </div>
        `;

      }).join('');
  }
}


function addAdminService() {

  const input =
    document.getElementById(
      'newServiceName'
    );


  const category =
    document.getElementById(
      'newServiceCategory'
    );


  const name =
    input
      ? input.value.trim()
      : '';


  if (!name) {

    alert(
      'Enter a service name.'
    );

    return;
  }


  const services =
    getAdminServices();


  if (
    services.some(function(s) {

      return (
        s.toLowerCase() ===
        name.toLowerCase()
      );

    })
  ) {

    alert(
      'This service already exists.'
    );

    return;
  }


  services.push(name);


  saveAdminServices(
    services
  );


  if (input) {
    input.value = '';
  }


  if (category) {
    category.value = '';
  }


  renderAdmin();
}


function removeAdminService(i) {

  const services =
    getAdminServices();


  if (
    !confirm(
      'Remove ' +
      services[i] +
      ' from the demo service list?'
    )
  ) {
    return;
  }


  services.splice(i, 1);


  saveAdminServices(
    services
  );


  renderAdmin();
}


/* =========================================================
   ROLE SECURITY
========================================================= */

function applyRoleSecurity() {

  try {

    const rawUser =
      localStorage.getItem(
        'fixoraUser'
      );


    const user =
      rawUser
        ? JSON.parse(rawUser)
        : null;


    const role =
      user && user.role
        ? user.role
        : 'guest';


    const providerMode =
      document.getElementById(
        'providerMode'
      );


    const providerPanel =
      document.getElementById(
        'providerPanel'
      );


    const providerLocked =
      document.getElementById(
        'providerLocked'
      );


    const adminPanel =
      document.getElementById(
        'adminPanel'
      );


    const adminLocked =
      document.getElementById(
        'adminLocked'
      );


    /* -----------------------------------------
       PROVIDER
    ----------------------------------------- */

    if (role !== 'provider') {

      if (providerMode) {

        providerMode.checked =
          false;

        providerMode.disabled =
          true;


        const label =
          providerMode.closest(
            'label'
          );


        if (label) {
          label.style.display =
            'none';
        }
      }


      if (providerPanel) {

        providerPanel.style.display =
          'none';
      }


      if (providerLocked) {

        providerLocked.style.display =
          'none';
      }

    } else {

      if (providerMode) {

        providerMode.disabled =
          false;


        const label =
          providerMode.closest(
            'label'
          );


        if (label) {
          label.style.display =
            'block';
        }
      }
    }


    /* -----------------------------------------
       ADMIN
    ----------------------------------------- */

    if (role !== 'admin') {

      if (adminPanel) {

        adminPanel.style.display =
          'none';
      }


      if (adminLocked) {

        adminLocked.style.display =
          'none';
      }


      document
        .querySelectorAll(
          '[onclick*="toggleAdmin"]'
        )
        .forEach(
          function(element) {

            element.style.display =
              'none';

          }
        );

    }


  } catch (error) {

    console.error(
      'Role protection error:',
      error
    );


    const providerPanel =
      document.getElementById(
        'providerPanel'
      );


    const adminPanel =
      document.getElementById(
        'adminPanel'
      );


    if (providerPanel) {

      providerPanel.style.display =
        'none';
    }


    if (adminPanel) {

      adminPanel.style.display =
        'none';
    }
  }
}


/* =========================================================
   ADMIN DASHBOARD SECURITY
========================================================= */

async function secureAdminDashboard() {

  try {

    const rawUser =
      localStorage.getItem(
        'fixoraUser'
      );


    const token =
      localStorage.getItem(
        'fixoraToken'
      );


    if (!rawUser || !token) {
      return;
    }


    const user =
      JSON.parse(rawUser);


    if (user.role !== 'admin') {
      return;
    }


    const response =
      await fetch(
        '/api/bookings',
        {
          headers: {
            'Authorization':
              'Bearer ' + token
          }
        }
      );


    if (!response.ok) {

      console.error(
        'Admin bookings request failed:',
        response.status
      );

      return;
    }


    const bookings =
      await response.json();


    const bookingsCount =
      document.getElementById(
        'adminBookings'
      );


    const pendingCount =
      document.getElementById(
        'adminPending'
      );


    const completedCount =
      document.getElementById(
        'adminCompleted'
      );


    const bookingsList =
      document.getElementById(
        'adminBookingsList'
      );


    if (bookingsCount) {

      bookingsCount.textContent =
        bookings.length;
    }


    if (pendingCount) {

      pendingCount.textContent =
        bookings.filter(function(b) {

          return (
            String(b.status)
              .toLowerCase() ===
            'pending'
          );

        }).length;
    }


    if (completedCount) {

      completedCount.textContent =
        bookings.filter(function(b) {

          return (
            String(b.status)
              .toLowerCase() ===
            'completed'
          );

        }).length;
    }


    if (bookingsList) {

      if (!bookings.length) {

        bookingsList.innerHTML =
          'No bookings yet.';

      } else {

        bookingsList.innerHTML =
          bookings.map(function(b) {

            return `
              <div class="admin-booking-item">

                <strong>
                  #${b.id}
                </strong>

                <div>
                  ${b.service || ''}
                </div>

                <div>
                  Customer:
                  ${b.customer_name ||
                    b.name ||
                    'Customer'}
                </div>

                <div>
                  Phone:
                  ${b.customer_phone ||
                    b.phone ||
                    'N/A'}
                </div>

                <div>
                  📅
                  ${b.booking_date ||
                    b.date ||
                    ''}
                </div>

                <div>
                  ⏰
                  ${b.booking_time ||
                    b.time ||
                    ''}
                </div>

                <div>
                  📍
                  ${b.area || ''}
                </div>

                <div>
                  Status:
                  <strong>
                    ${b.status ||
                      'Pending'}
                  </strong>
                </div>

                ${
                  b.provider_name
                    ? `
                      <div>
                        Provider:
                        ${b.provider_name}
                      </div>
                    `
                    : ''
                }

                ${
                  b.details
                    ? `
                      <div>
                        Details:
                        ${b.details}
                      </div>
                    `
                    : ''
                }

              </div>
            `;

          }).join('');
      }
    }


  } catch (error) {

    console.error(
      'Admin dashboard error:',
      error
    );
  }
}


/* =========================================================
   MOBILE MENU
========================================================= */

function toggleMobileMenu() {

  const nav =
    document.getElementById(
      'mainNav'
    );


  if (nav) {

    nav.classList.toggle(
      'mobile-open'
    );
  }
}


/* =========================================================
   INITIAL LOAD
========================================================= */

document.addEventListener(
  'DOMContentLoaded',
  function() {

    applyRoleSecurity();

    renderDashboard();


    setTimeout(
      secureAdminDashboard,
      500
    );

  }
);


/* =========================================================
   AUTO REFRESH
========================================================= */

setInterval(
  function() {

    const rawUser =
      localStorage.getItem(
        'fixoraUser'
      );


    if (!rawUser) {
      return;
    }


    try {

      const user =
        JSON.parse(rawUser);


      if (user.role === 'admin') {

        secureAdminDashboard();
      }


      if (user.role === 'provider') {

        const panel =
          document.getElementById(
            'providerPanel'
          );


        if (
          panel &&
          panel.style.display !== 'none'
        ) {

          renderProviderBookings();
        }
      }


    } catch (error) {

      console.error(error);
    }

  },
  10000
);
