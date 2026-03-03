import type { HTMLAttributes } from "react";
import "./NewsletterForm.scss";
interface Props extends HTMLAttributes<HTMLFormElement> {}

export function NewsletterForm({ ...props }: Props) {
  return (
    <form className="rounded" name="newsletter-signup">
      <p>Subscribe to our Newsletter</p>
      <div className="inputs">
        <div>
          <label htmlFor="first-name">First Name</label>
          <input type="text" name="first-name" />
        </div>
        <div>
          <label htmlFor="last-name">Last Name</label>
          <input type="text" name="last-name" />
        </div>
        <div>
          <label htmlFor="email">Email</label>
          <input type="email" name="email" />
        </div>
        <button type="submit">Subscribe</button>
      </div>
    </form>
  );
}
