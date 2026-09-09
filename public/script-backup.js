const services=[
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

const list=document.getElementById('serviceList');
const select=document.getElementById('serviceSelect');

function render(items=services){
  if(!list)return;

  list.innerHTML=items.map(s=>`
    <article class="service-item">
      <div style="font-size:28px">${s[0]}</div>
      <h3>${s[1]}</h3>
      <p style="color:#71829b;font-size:12px;margin-top:5px">${s[3]}</p>
      <button onclick="book('${s[1].replace(/'/g,"\\'")}')">Book Now</button>
    </article>
  `).join('');
}

render();

if(select){
  services.forEach(s=>{
    const o=document.createElement('option');
    o.value=s[1];
    o.textContent=s[1];
    select.appendChild(o);
  });
}

function filterCategory(cat){
  const items=services.filter(s=>s[2]===cat);
  render(items);

  const serviceList=document.getElementById('serviceList');

  if(serviceList){
    serviceList.scrollIntoView({
      behavior:'smooth',
      block:'start'
    });
  }
}

function showAll(){
  render();

  const serviceList=document.getElementById('serviceList');

  if(serviceList){
    serviceList.scrollIntoView({
      behavior:'smooth'
    });
  }
}

function searchServices(){
  const input=document.getElementById('searchInput');

  if(!input)return;

  const q=input.value.toLowerCase().trim();

  const items=services.filter(s=>
    (s[1]+' '+s[3]+' '+s[2])
    .toLowerCase()
    .includes(q)
  );

  render(items);

  const serviceList=document.getElementById('serviceList');

  if(serviceList){
    serviceList.scrollIntoView({
      behavior:'smooth',
      block:'start'
    });
  }
}

function book(service){
  if(select){
    select.value=service;
  }

  const booking=document.getElementById('booking');

  if(booking){
    booking.scrollIntoView({
      behavior:'smooth'
    });
  }
}


/* =========================
   WHATSAPP
========================= */

function whatsappBooking(){
  const text=encodeURIComponent(
    'Hello Fixora! I want to book a service.'
  );

  window.open(
    'https://wa.me/923207180728?text='+text,
    '_blank'
  );
}


/* =========================
   CUSTOMER BOOKINGS
========================= */

const BOOKING_KEY="fixoraBookings";

async function getBookings(){

  const token=localStorage.getItem("fixoraToken");

  if(!token)return [];

  try{

    const response=await fetch("/api/bookings",{
      headers:{
        "Authorization":"Bearer "+token
      }
    });

    if(!response.ok)return [];

    const rows=await response.json();

    return rows.map(function(b){

      return Object.assign({},b,{
        date:b.date || b.booking_date,
        time:b.time || b.booking_time,
        status:(b.status || "Pending")
          .replace(/^pending$/i,"Pending")
      });

    });

  }catch(error){

    console.error(error);
    return [];

  }
}

function saveBookings(items){
  localStorage.setItem(
    BOOKING_KEY,
    JSON.stringify(items)
  );
}


/* =========================
   BOOKING FORM
========================= */

const bookingForm=document.getElementById('bookingForm');

if(bookingForm){

  bookingForm.addEventListener(
    'submit',
    async function(e){

      e.preventDefault();

      const token=localStorage.getItem('fixoraToken');

      if(!token){

        alert("Please login first.");
        openAuth('login');
        return;

      }

      const booking={
        service:document.getElementById('serviceSelect').value,
        area:document.getElementById('area').value.trim(),
        date:document.getElementById('date').value,
        time:document.getElementById('time').value,
        details:document.getElementById('details').value.trim()
      };

      if(
        !booking.service ||
        !booking.area ||
        !booking.date ||
        !booking.time
      ){

        alert("Please fill all required fields.");
        return;

      }

      try{

        const response=await fetch('/api/bookings',{
          method:'POST',

          headers:{
            'Content-Type':'application/json',
            'Authorization':'Bearer '+token
          },

          body:JSON.stringify(booking)
        });

        const data=await response.json();

        if(!response.ok){

          alert(
            data.error ||
            "Booking could not be created."
          );

          return;

        }

        alert(
          "Booking created successfully! Booking ID: "+
          data.id
        );


        /* WhatsApp booking notification */

        const message=encodeURIComponent(
          "Hello Fixora! New Booking\n"+
          "Booking ID: "+data.id+"\n"+
          "Service: "+data.service+"\n"+
          "Area: "+data.area+"\n"+
          "Date: "+data.booking_date+"\n"+
          "Time: "+data.booking_time+"\n"+
          "Details: "+(data.details || "N/A")
        );

        window.open(
          "https://wa.me/923207180728?text="+message,
          "_blank"
        );


        this.reset();

        await renderDashboard();

        const dash=document.getElementById("dashboard");

        if(dash){

          dash.scrollIntoView({
            behavior:"smooth"
          });

        }

      }catch(error){

        console.error(error);

        alert(
          "Unable to connect to Fixora server."
        );

      }

    }
  );

}


/* =========================
   CUSTOMER AUTH ONLY
========================= */

function openAuth(type){

  const modal=document.getElementById('modal');
  const title=document.getElementById('modalTitle');
  const text=document.getElementById('modalText');

  if(!modal || !title || !text)return;


  if(type==='signup'){

    title.textContent='Create Customer Account';

    text.textContent=
      'Sign up to manage bookings and reviews.';

  }else{

    title.textContent='Welcome Back';

    text.textContent=
      'Log in to your Fixora account.';

  }

  modal.style.display='grid';
}


function closeModal(){

  const modal=document.getElementById('modal');

  if(modal){
    modal.style.display='none';
  }

}


const authModal=document.getElementById('modal');

if(authModal){

  authModal.addEventListener(
    'click',
    e=>{

      if(e.target.id==='modal'){
        closeModal();
      }

    }
  );

}


const authForm=document.getElementById('authForm');

if(authForm){

  authForm.addEventListener(
    'submit',
    async(e)=>{

      e.preventDefault();

      const name=
        document.getElementById('authName')
        .value
        .trim();

      const phone=
        document.getElementById('authPhone')
        .value
        .trim();

      const password=
        document.getElementById('authPassword')
        .value;


      const title=
        document.getElementById('modalTitle')
        .textContent;


      const isSignup=
        title.includes('Create Customer');


      if(
        !phone ||
        !password ||
        (isSignup && !name)
      ){

        alert(
          'Please fill all required fields.'
        );

        return;

      }


      try{

        const response=await fetch(
          '/api/auth/'+
          (isSignup ? 'signup':'login'),
          {
            method:'POST',

            headers:{
              'Content-Type':
              'application/json'
            },

            body:JSON.stringify(

              isSignup

                ? {
                    name,
                    phone,
                    password,
                    role:'customer'
                  }

                : {
                    phone,
                    password
                  }

            )

          }
        );


        const data=await response.json();


        if(!response.ok){

          alert(
            data.error ||
            'Something went wrong.'
          );

          return;

        }


        localStorage.setItem(
          'fixoraToken',
          data.token
        );

        localStorage.setItem(
          'fixoraUser',
          JSON.stringify(data.user)
        );
        updateAdminVisibility();


        alert(
          isSignup
            ? 'Customer account created successfully!'
            : 'Login successful!'
        );


        closeModal();

        await renderDashboard();

      }catch(error){

        console.error(error);

        alert(
          'Unable to connect to Fixora server.'
        );

      }

    }
  );

}


/* =========================
   CUSTOMER DASHBOARD
========================= */

async function renderDashboard(){

  const box=
    document.getElementById(
      "bookingDashboard"
    );

  if(!box)return;

  const items=await getBookings();


  if(!items.length){

    box.innerHTML=`
      <div class="empty-bookings">
        <div>📋</div>
        <h3>No bookings yet</h3>
        <p>Your service requests will appear here.</p>
      </div>
    `;

    return;

  }


  box.innerHTML=items.map(function(b){

    const cls=
      b.status
      .toLowerCase()
      .replace(/\s+/g,"-");


    return `
      <article class="booking-card-item">

        <div class="booking-top">

          <div>
            <span class="booking-id">${b.id}</span>
            <h3>${b.service}</h3>
          </div>

          <span class="status ${cls}">
            ${b.status}
          </span>

        </div>

        <div class="booking-meta">

          <span>📅 ${b.date}</span>
          <span>⏰ ${b.time}</span>
          <span>📍 ${b.area}</span>

        </div>

        ${
          b.details
          ? `<p class="booking-details">${b.details}</p>`
          : ''
        }

        <div class="booking-actions">

          ${
            b.status==="Pending"
            ?
            `<button
              class="cancel-btn"
              onclick="cancelBooking('${b.id}')"
            >
              Cancel
            </button>`
            :
            ''
          }

          ${
            b.status==="Completed" && !b.rating
            ?
            `<button
              onclick="openReview('${b.id}')"
            >
              ⭐ Rate Service
            </button>`
            :
            ''
          }

          ${
            b.rating
            ?
            `<span class="review-done">
              ★★★★★ ${b.rating}/5
            </span>`
            :
            ''
          }

        </div>

      </article>
    `;

  }).join("");

}


/* =========================
   CANCEL BOOKING
========================= */

async function cancelBooking(id){

  if(!confirm("Cancel this booking?"))return;

  const token=
    localStorage.getItem("fixoraToken");


  try{

    const response=await fetch(
      "/api/bookings/"+
      encodeURIComponent(id)+
      "/cancel",
      {
        method:"PATCH",

        headers:{
          "Authorization":
          "Bearer "+token
        }
      }
    );


    const data=await response.json();


    if(!response.ok){

      alert(
        data.error ||
        "Booking could not be cancelled."
      );

      return;

    }


    await renderDashboard();

  }catch(e){

    console.error(e);

    alert(
      "Unable to connect to Fixora server."
    );

  }

}


/* =========================
   REVIEWS
========================= */

function openReview(id){

  window._fixoraReviewId=String(id);
  window._fixoraRating=0;


  document
    .querySelectorAll(
      "#ratingPicker button"
    )
    .forEach(function(btn){

      btn.classList.remove("selected");

    });


  const reviewText=
    document.getElementById("reviewText");

  if(reviewText){
    reviewText.value="";
  }


  const modal=
    document.getElementById(
      "reviewModal"
    );

  if(modal){
    modal.style.display="grid";
  }

}


function closeReview(){

  const modal=
    document.getElementById(
      "reviewModal"
    );

  if(modal){
    modal.style.display="none";
  }

}


document
  .querySelectorAll(
    "#ratingPicker button"
  )
  .forEach(function(btn){

    btn.addEventListener(
      "click",
      function(){

        window._fixoraRating=
          Number(btn.dataset.rating);


        document
          .querySelectorAll(
            "#ratingPicker button"
          )
          .forEach(function(x){

            x.classList.toggle(
              "selected",
              Number(x.dataset.rating)
              <=
              window._fixoraRating
            );

          });

      }
    );

  });


async function submitReview(){

  if(!window._fixoraRating){

    alert(
      "Please select a rating."
    );

    return;

  }


  const token=
    localStorage.getItem(
      "fixoraToken"
    );


  const reviewEl=
    document.getElementById(
      "reviewText"
    );


  try{

    const response=await fetch(
      "/api/bookings/"+
      encodeURIComponent(
        window._fixoraReviewId
      )+
      "/review",
      {
        method:"POST",

        headers:{
          "Content-Type":
          "application/json",

          "Authorization":
          "Bearer "+token
        },

        body:JSON.stringify({
          rating:window._fixoraRating,

          review:
            reviewEl
            ?
            reviewEl.value.trim()
            :
            ""
        })
      }
    );


    const data=await response.json();


    if(!response.ok){

      alert(
        data.error ||
        "Review could not be saved."
      );

      return;

    }


    closeReview();

    await renderDashboard();

    alert(
      "Thank you for your review!"
    );


  }catch(e){

    console.error(e);

    alert(
      "Unable to connect to Fixora server."
    );

  }

}


/* =========================
   ADMIN DASHBOARD
========================= */

const ADMIN_SERVICE_KEY=
  "fixoraAdminServices";


const defaultAdminServices=[
  "Plumber",
  "Electrician",
  "Carpenter",
  "Painter",
  "AC Repair",
  "Refrigerator Repair",
  "Washing Machine Repair",
  "Car Mechanic",
  "Bike Mechanic",
  "Glass Work",
  "Aluminium Work",
  "Home Cleaning",
  "Deep Cleaning",
  "Sofa Cleaning",
  "Home Shifting",
  "Small Delivery",
  "Laptop Repair",
  "CCTV Installation",
  "Wi-Fi Setup",
  "Gardening",
  "Pest Control",
  "Solar Installation",
  "Generator Repair",
  "Welding Work"
];


function getAdminServices(){

  try{

    const saved=
      JSON.parse(
        localStorage.getItem(
          ADMIN_SERVICE_KEY
        )
      );


    return Array.isArray(saved)
      &&
      saved.length
      ?
      saved
      :
      defaultAdminServices.slice();


  }catch(e){

    return defaultAdminServices.slice();

  }

}


function saveAdminServices(x){

  localStorage.setItem(
    ADMIN_SERVICE_KEY,
    JSON.stringify(x)
  );

}


async function toggleAdmin(){

  const panel=document.getElementById('adminPanel');
  const locked=document.getElementById('adminLocked');

  if(!panel || !locked)return;

  let user=null;
  try{
    user=JSON.parse(localStorage.getItem('fixoraUser')||'null');
  }catch(e){
    user=null;
  }

  if(!user || user.role!=='admin'){
    panel.style.display='none';
    locked.style.display='block';
    alert('Admin login required!');
    return;
  }

  const open=panel.style.display==='none';

  panel.style.display=open?'block':'none';
  locked.style.display=open?'none':'block';

  if(open){
    await renderAdmin();
  }

}






async function renderAdmin(){

  const items=
    await getBookings();


  const bookingsEl=
    document.getElementById(
      "adminBookings"
    );

  const pendingEl=
    document.getElementById(
      "adminPending"
    );

  const completedEl=
    document.getElementById(
      "adminCompleted"
    );

  const servicesEl=
    document.getElementById(
      "adminServices"
    );


  if(bookingsEl){
    bookingsEl.textContent=
      items.length;
  }


  if(pendingEl){

    pendingEl.textContent=
      items.filter(
        b=>b.status==="Pending"
      ).length;

  }


  if(completedEl){

    completedEl.textContent=
      items.filter(
        b=>b.status==="Completed"
      ).length;

  }


  const services=
    getAdminServices();


  if(servicesEl){

    servicesEl.textContent=
      services.length;

  }


  const list=
    document.getElementById(
      "adminBookingsList"
    );


  if(list){

    list.innerHTML=
      items.length

      ?

      items.map(
        b=>
        '<div class="admin-row">'+

          '<div>'+

            '<b>'+b.id+'</b>'+

            '<strong>'+
            b.service+
            '</strong>'+

            '<small>'+
            (b.name || "Customer")+
            ' · '+
            b.area+
            ' · '+
            b.date+
            ' '+
            b.time+
            '</small>'+

          '</div>'+

          '<span class="status '+
          b.status
            .toLowerCase()
            .replace(/\s+/g,"-")+
          '">'+
          b.status+
          '</span>'+

        '</div>'
      ).join("")

      :

      '<p class="admin-empty">'+
      'No bookings yet.'+
      '</p>';

  }


  const serviceList=
    document.getElementById(
      "adminServicesList"
    );


  if(serviceList){

    serviceList.innerHTML=
      services.map(
        (s,i)=>
        '<div class="service-admin-row">'+

          '<span>🔧 '+s+'</span>'+

          '<button onclick="removeAdminService('+
          i+
          ')">Remove</button>'+

        '</div>'
      ).join("");

  }

}


function addAdminService(){

  const input=
    document.getElementById(
      "newServiceName"
    );

  const category=
    document.getElementById(
      "newServiceCategory"
    );


  if(!input)return;


  const name=
    input.value.trim();


  if(!name){

    alert(
      "Enter a service name."
    );

    return;

  }


  const services=
    getAdminServices();


  if(
    services.some(
      s=>
      s.toLowerCase()===
      name.toLowerCase()
    )
  ){

    alert(
      "This service already exists."
    );

    return;

  }


  services.push(name);

  saveAdminServices(services);


  input.value="";

  if(category){
    category.value="";
  }


  renderAdmin();

}


function removeAdminService(i){

  const services=
    getAdminServices();


  if(
    !services[i]
  ){
    return;
  }


  if(
    !confirm(
      "Remove "+
      services[i]+
      " from the demo service list?"
    )
  ){

    return;

  }


  services.splice(i,1);

  saveAdminServices(services);

  renderAdmin();

}


/* =========================
   START DASHBOARD
========================= */

renderDashboard();


