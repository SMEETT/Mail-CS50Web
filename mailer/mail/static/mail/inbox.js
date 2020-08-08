
// wait for page to load
document.addEventListener('DOMContentLoaded', function() {
 
  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // By default, load the compose_mail view
  compose_email();


  document.querySelector('#compose-form').onsubmit = () => {
    // Select relevant elements
    const recipients_element = document.querySelector('#compose-recipients')
    const subject_element = document.querySelector('#compose-subject')
    const body_element = document.querySelector('#compose-body')

    fetch('/emails', {
      method: 'POST',
      body: JSON.stringify ({
            recipients: recipients_element.value,
            subject: subject_element.value,
            body: body_element.value
      })
    })
    .then(response => response.json())
    .then(result => {
        // Print result
        console.log(result);

        if (result.hasOwnProperty('error')) {
          alert(`ERROR: ${result.error}`)
        } else {
          load_mailbox('sent')
        }
    });
    return false;
  }

}); // DOMContentLoaded






// function to write new emails
function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#email-detail-view').style.display = 'none'
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';

  // check for optional argument
  if (arguments.length != 0) {
    console.log(arguments[0])
    const context = arguments[0]

    document.querySelector('#compose-recipients').value = context.sender;
      // check if subject already starts with "Re:", if not add it
      if (context.subject.slice(0, 4) === 'Re: ') {
        document.querySelector('#compose-subject').value = context.subject;
      } else {
        document.querySelector('#compose-subject').value = 'Re: ' + context.subject;
      }

    document.querySelector('#compose-body').value = context.timestamp + " " + context.sender + " wrote: " + context.body;

  }

} // end of compose_email




function view_email(id) {

  console.log(id)

  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-detail-view').style.display = 'block'

  // query for email-detail-view and clear 
  const email_detail_view = document.querySelector('#email-detail-view')
  email_detail_view.innerHTML = ''

  // Add Heading
  const heading = document.createElement("h3")
  heading.innerText = "E-Mail Details"
  email_detail_view.append(heading)

  // fetch email
  fetch(`/emails/${id}`)
  .then(response => response.json())
  .then(email => {
    
    const email_sender = document.createElement('div')
    email_sender.innerHTML = "From: " + email.sender

    const email_subject = document.createElement('div')
    email_subject.innerHTML = "Subject: " + email.subject

    const email_timestamp = document.createElement('div')
    email_timestamp.innerHTML = "Date: " + email.timestamp

    const email_body = document.createElement('div')
    email_body.innerHTML = "Body: " + email.body

    // Reply button and function-call
    const email_reply_btn = document.createElement('button')
    email_reply_btn.innerText = 'Reply'
    email_reply_btn.onclick = () => {
      
      const context = {sender: email.sender, subject: email.subject, timestamp: email.timestamp, body: email.body}
      compose_email(context)

    } // reply button end


    email_detail_view.append(email_sender, email_subject, email_timestamp, email_body, email_reply_btn)
    
    // mark the e-mail as 'read'
    fetch(`/emails/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
          read: true
      })
    })


}); // end of fetch

} // end of view_email()


function load_mailbox(mailbox) {

  // Show the mailbox and hide other views
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-detail-view').style.display = 'none'
  document.querySelector('#emails-view').style.display = 'block';

  // query for emails-view and clear 
  const emails_view = document.querySelector('#emails-view')
  emails_view.innerHTML = ''

  // create and append heading
  const heading = document.createElement("h3")
  heading.id = 'emails-heading'
  heading.innerText = mailbox.charAt(0).toUpperCase() + mailbox.slice(1)
  emails_view.append(heading)


  // fetch emails
    fetch(`/emails/${mailbox}`)
    .then(response => response.json())
    .then(emails => {
    
    emails.forEach(append_email);
    
    // function to build an email
    function append_email(email, index) {
      console.log(email)
      
      const email_wrapper = document.createElement("div")
      email_wrapper.id = 'email-wrapper'
      email_wrapper.classList.add("border");
  
      const email_subject_div = document.createElement("div")
      const email_timestamp_div = document.createElement("div")

      console.log(`MAILBOX: ${mailbox}`)
      

      if (mailbox === 'sent') {
        const email_recepients_div = document.createElement("div")

        email_recepients_div.innerHTML = "Recepient(s): "
        email.recipients.forEach((recepient, index) => {
          email_recepients_div.innerHTML += recepient
          if (index + 1 < email.recipients.length)
            email_recepients_div.innerHTML += " / "
          email_wrapper.append(email_recepients_div)
        });

      } else if (mailbox === 'inbox') {
        console.log('inbox!')
        const email_sender_div = document.createElement("div")
        email_sender_div.innerHTML = "From: " + email.sender

        const archive_button = document.createElement("button")
        archive_button.innerHTML = "A"
        archive_button.onclick = () => {
          
          fetch(`/emails/${email.id}`, {
            method: 'PUT',
            body: JSON.stringify({
                archived: true
            })
          })

        } // archive_button end

        email_wrapper.append(email_sender_div, archive_button)

      } else if (mailbox === 'archive') {
        
        console.log('inbox!')
        const email_sender_div = document.createElement("div")
        email_sender_div.innerHTML = "From: " + email.sender

        const unarchive_button = document.createElement("button")
        unarchive_button.innerHTML = "U"
        unarchive_button.onclick = () => {
          
          fetch(`/emails/${email.id}`, {
            method: 'PUT',
            body: JSON.stringify({
                archived: false
            })
          })
      } // unarchiive button end

      email_wrapper.append(email_sender_div, unarchive_button)

    }
  
      // Set and Append Subject and Timestamp
      email_timestamp_div.innerHTML = email.timestamp
      
      // link subject to the email-detail-view     
      const email_detail_link = document.createElement('a')
      email_detail_link.href = `javascript:view_email(${email.id})`
      email_detail_link.innerText = "Subject: " + email.subject
      
      email_wrapper.append(email_detail_link, email_timestamp_div)

      // Set Background color according to read/unread status
      if (email.read === false) {
        email_wrapper.style.backgroundColor = '#e6e6e6'
      } else if (email.read === true) {
        email_wrapper.style.backgroundColor = '#FFF'
      }

      // Finally append the complete email_wrapper to view
      document.querySelector('#emails-view').append(email_wrapper)

    }
  
  });

  
} // end of load_mailbox()


