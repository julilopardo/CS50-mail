document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  document.querySelector('form').onsubmit= send_email;

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#emails-content').style.display = 'none';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';

}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#emails-content').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  // Show the mailbox elemments
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
    console.log(emails);
    emails.forEach(email => show_email(email, mailbox));

  })
}

function send_email() {

  const recipients = document.querySelector('#compose-recipients').value;
  const subject = document.querySelector('#compose-subject').value;
  const body = document.querySelector('#compose-body').value;

    fetch('/emails', {
      method: 'POST',
      body: JSON.stringify({
        recipients : recipients,
        subject : subject,
        body : body
      })
    })
    .then(response => response.json())
    .then(result => {
        console.log(result);
    })

    //localStorage.clear();
    //load_mailbox('sent');
    setTimeout(function(){ load_mailbox('sent'); }, 100)
      // to avoid reloading the page and go to "sent" mailbox
    return false;
      
  }

function show_email(email, mailbox) {
    //Create email card row div
    const emailcard= document.createElement('div');
    emailcard.id= "email";
    emailcard.className= "row";
    //Create sender/recipients column (inbox o sentbox)
    const sender = document.createElement('div');
    sender.id= "email-recipient";
    sender.className= "col-lg-2 col-md-3 col-sm-12";
    console.log(`Mailbox: ${mailbox}`);
    if (mailbox === "inbox") {
      sender.innerHTML = email.sender;
    }
    else {
      sender.innerHTML = email.recipients[0];
    }
    emailcard.append(sender);
    //Create subject column
    const subject= document.createElement('div');
    subject.id= "email-subject";
    subject.className = "col-lg-6 col-md-5 col-sm-12";
    subject.innerHTML = email.subject;
    emailcard.append(subject);
    //Create date column
    const timestamp= document.createElement('div');
    timestamp.id= "email-timestamp";
    timestamp.className= "col-lg-3 col-md-3 col-sm-12";
    timestamp.innerHTML= email.timestamp;
    emailcard.append(timestamp);
    //Create archived button column
    console.log(mailbox);
    if(mailbox !== "sent") {
      const archive_button = document.createElement('button');
      archive_button.id= "archive-button";
      if (mailbox === "archive") {
        archive_button.innerHTML= "Remove";
      }
      else {
        archive_button.innerHTML= "Archive";
      }
      archive_button.className= "btn btn-primary btn-sm"
      emailcard.append(archive_button);
      archive_button.addEventListener('click', () => archive_email(email.id, email.archived));
    }
    //Format of card if unread or read
    const card =  document.createElement('div');
    card.id= "email-card";
    if(email.read){
      card.className= "read";
    }
    else {
      card.className= "card";
    }
    card.append(emailcard);

    //Add event when click on card elements
    sender.addEventListener('click', () => view_email(email.id));
    subject.addEventListener('click', () => view_email(email.id));
    timestamp.addEventListener('click', () => view_email(email.id));
    document.querySelector('#emails-view').append(card);

  }

function archive_email(email_id, email_archived) {
    const new_state =  !email_archived;
    console.log(`Change archive status of email ${new_state}`);
    fetch(`/emails/${email_id}`, {
      method: 'PUT',
      body: body= JSON.stringify({
        archived: new_state
      })
    })
    load_mailbox('inbox');
    window.location.reload();
  }

function view_email(email_id) {
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#emails-content').style.display = 'block';

  fetch(`/emails/${email_id}`)
  .then(response => response.json())
  .then(email => {
    is_read(email_id);
    console.log(email);
    document.querySelector('#email-content-sender').innerHTML= email.sender;
    document.querySelector('#email-content-recipients').innerHTML= email.recipients;
    document.querySelector('#email-content-subject').innerHTML= email.subject;
    document.querySelector('#email-content-date').innerHTML= email.timestamp;
    document.querySelector('#email-content-body').innerHTML= email.body;

    document.getElementById('reply-button').addEventListener('click', () => reply(email));

  });
  return false;

}

function is_read(email_id) {
  console.log('set email as read');
  fetch(`/emails/${email_id}`, {
    method: 'PUT',
    body: body= JSON.stringify({
      read: true
    })
  })
}

function reply(email) {
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#emails-content').style.display = 'none';

  document.querySelector('#compose-recipients').value= email.sender;
  if (email.subject.indexOf("Re: ") === -1) {
    email.subject= "Re: "+email.subject;
  }
  document.querySelector("#compose-subject").value= email.subject;
  document.querySelector("#compose-body").value= `\n \n \n On ${email.timestamp} ${email.sender} wrote: \n ${email.body}`;

}