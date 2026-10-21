/**
 * The Bilgi Sayfaları in English: a courtesy translation of lib/bilgi's
 * Turkish documents, block for block — same slugs, same numbering, no
 * obligation added or dropped. The Turkish text is the binding one, and each
 * document opens by saying so. Names, addresses, tax and law numbers stay as
 * the Turkish has them.
 */

import type { BilgiDocument } from "@/lib/bilgi";

const NOTICE = { type: "notice", text: "This is a courtesy translation. The Turkish version is the legally binding text." } as const;

export const PERKS_PAGE_EN = {
  title: "Perks and Benefits",
  description:
    "Free shipping, same-day courier within Istanbul, instalments, cart and bank transfer discounts, SultanPuan and KumbaraPuan: every perk on your individual purchases.",
};

export const BILGI_DOCUMENTS_EN: BilgiDocument[] = [
  {
    slug: "uyelik-ve-kullanim-sartlari",
    title: "Membership and Terms of Use",
    sourceTitle: "MEMBERSHIP AND TERMS OF USE",
    description:
      "Sultan Nargile membership and terms of use: age limit, copyright, account security, pricing and limitation of liability.",
    blocks: [
      NOTICE,
      { type: "h2", text: "1. PARTIES AND SCOPE" },
      {
        type: "p",
        text: 'All users who visit this website (nargilemalzemesi.com), become members of it or use the services on the site are deemed to have read, understood and accepted in advance all the provisions of these "Terms of Use". If you do not accept these terms, please stop using the site.',
      },
      { type: "h2", text: "2. AGE RESTRICTION AND LEGAL WARNING" },
      {
        type: "p",
        text: "2.1. The hookah sets and tobacco-product accessories sold on our site are, as required by law, intended for use by adults only.",
      },
      {
        type: "p",
        text: "2.2. You must be at least 18 years old to become a member of our site and to shop on it. When registering, the Buyer legally undertakes that the date of birth and identity information they provide are accurate. All legal liability arising from misleading statements rests with the user.",
      },
      { type: "h2", text: "3. INTELLECTUAL AND INDUSTRIAL PROPERTY RIGHTS (COPYRIGHT)" },
      {
        type: "p",
        text: "All designs, texts, product images, videos, logos, graphics and software on the site belong to our company and are protected under intellectual and industrial property law. Copying the site's content in whole or in part, publishing it in other media, using it for commercial purposes or modifying it without our company's written permission is strictly prohibited. Legal action will be taken if this is detected.",
      },
      { type: "h2", text: "4. USE AND ACCOUNT SECURITY" },
      {
        type: "p",
        text: "4.1. Members are responsible for the security of the passwords they set when registering on our site. Our company cannot be held responsible for any damage that may arise from a password being shared with third parties or used without authorisation.",
      },
      {
        type: "p",
        text: "4.2. While using the site, users may not act contrary to general morality, public order or the laws of the Republic of Türkiye. Activities that threaten the security of the site, obstruct its operation through software or harm other users (viruses, bots, spam, etc.) are prohibited.",
      },
      { type: "h2", text: "5. SERVICE CHANGES AND PRICING" },
      {
        type: "p",
        text: "Our company reserves the right to change, update or remove the range of products on our site, product prices, stock status, shipping terms and the text of these Terms of Use at any time, without prior notice. The current terms take effect as soon as they are published on the site.",
      },
      { type: "h2", text: "6. LIMITATION OF LIABILITY" },
      {
        type: "p",
        text: "Our company cannot be held legally liable for any data loss, hardware damage or loss of profit that may arise from the use of the site, cyber attacks, internet outages or errors made by the user.",
      },
      { type: "h2", text: "7. ENTRY INTO FORCE AND AMENDMENTS" },
      {
        type: "p",
        text: "These Terms of Use take effect indefinitely from the moment the user enters the site or becomes a member. Our company may unilaterally amend the provisions of this agreement where it deems necessary.",
      },
    ],
  },
  {
    slug: "kargo-ve-teslimat",
    title: "Shipping and Delivery Terms",
    sourceTitle: "SHIPPING AND DELIVERY TERMS",
    description:
      "Sultan Nargile shipping and delivery terms: dispatch time, the free shipping threshold, return shipments and the damage assessment report.",
    blocks: [
      NOTICE,
      {
        type: "ol",
        items: [
          "Your orders are handed over to the cargo company within 2 business days at the latest. Orders placed at the weekend are processed and shipped on Monday.",
          "Our shop applies a minimum order amount for free shipping. You can see whether your order qualifies for free shipping on the product page or in your cart.",
          "For orders below the threshold, the shipping fee is paid by the buyer. You must accept the shipping terms to complete your purchase.",
          "When your order is handed over to the cargo company, you will be notified by email or SMS.",
          "If the shipment is returned because the address details were entered incorrectly or the customer did not accept delivery, your order may be cancelled or, at the customer's request, sent a second time with the shipping fee payable by the recipient. For orders cancelled under the statutory right of withdrawal, as consumer legislation requires, the refund is made in full, without any deduction.",
          "Our company packs your products carefully so that they are not damaged, and guarantees that they are delivered intact.",
          "In the event of a return or exchange request, it is the customer's responsibility to pack the product carefully in its original box so that it is not damaged or broken, and to deliver it to our company intact.",
          "If there is clearly visible damage or breakage on the product at the time of delivery, the buyer is obliged to have the cargo officer draw up a 'Damage Assessment Report'. In the case of hidden damage noticed after the product has been received, the damage and the visual evidence (photo/video) must be reported to our company in writing (email/support request) within 3 days of the delivery date at the latest. If this period is exceeded, our company will not be held responsible.",
        ],
      },
    ],
  },
  {
    slug: "mesafeli-satis-sozlesmesi",
    title: "Distance Sales Agreement",
    sourceTitle: "DISTANCE SALES AGREEMENT",
    description:
      "Sultan Nargile distance sales agreement: delivery and stock conditions, exchanges, the 14-day right of withdrawal and non-returnable products.",
    blocks: [
      NOTICE,
      { type: "h2", text: "1. PARTIES" },
      { type: "h3", text: "1.1. SELLER INFORMATION:" },
      { type: "p", text: "Trade name: Sultan Nargile / Pınar Kuş" },
      { type: "p", text: "Address: Soğanlı mah. site sok.no:5/A Bahçelievler / İstanbul" },
      { type: "p", text: "Phone: 0212 553 05 92 0532 787 30 43" },
      { type: "p", text: "Email: turhan@nargilemalzemesi.com" },
      { type: "p", text: "MERSİS / Tax Number: Tax No: 5980781207" },
      { type: "h3", text: "1.2. BUYER INFORMATION:" },
      {
        type: "p",
        text: "The person who is a member of the shopping site or places an order, and whose details appear on the invoice and the order form. (When the agreement is approved, the system will fill in this information automatically.)",
      },
      { type: "h2", text: "2. SUBJECT OF THE AGREEMENT" },
      {
        type: "p",
        text: "The subject of this Agreement is to determine the rights and obligations of the parties, in accordance with the provisions of Law No. 6502 on the Protection of the Consumer and the Regulation on Distance Contracts, regarding the sale and delivery of the product whose characteristics and sale price are specified and which the Buyer has ordered electronically through the Seller's website.",
      },
      { type: "h2", text: "3. PRODUCT SUBJECT TO THE AGREEMENT AND PAYMENT INFORMATION" },
      {
        type: "p",
        text: "The type, quantity, brand/model and sale price of the product(s) purchased electronically through the website, the payment method and the information as at the completion of the order are as stated at the billing and delivery address declared by the Buyer. The system automatically reflects this information in the agreement at the time of the order.",
      },
      { type: "h2", text: "4. DELIVERY, SHIPPING AND STOCK CONDITIONS" },
      {
        type: "p",
        text: "4.1. Orders are handed over to the cargo company within 2 business days at the latest, for delivery to the delivery address the Buyer specified in the order form. Orders falling on a weekend or a public holiday are processed and shipped on the first following business day.",
      },
      {
        type: "p",
        text: "4.2. Our shop applies a minimum order amount for free shipping. If the order total is below this threshold, the shipping fee is paid by the Buyer and is shown clearly on the cart/payment screen. By completing the purchase, the Buyer is deemed to have accepted these shipping conditions.",
      },
      {
        type: "p",
        text: "4.3. When the order is handed over to the cargo company, the Buyer is notified through the email or SMS channels registered in the system.",
      },
      {
        type: "p",
        text: "4.4. If the shipment is returned to the Seller because the Buyer entered incorrect/incomplete address details or was not at the address, the order may be cancelled and the amount refunded in full, without deduction, or, at the Buyer's request, a second shipment is made with the shipping fee payable by the recipient.",
      },
      {
        type: "p",
        text: "4.5. Impossibility of Supplying the Ordered Product (Stock Error): If the Seller realises that the ordered product is out of stock or cannot be supplied because of system errors, simultaneous orders or supplier-related delays, the Seller is obliged to notify the Buyer of this in writing (email/SMS) within 3 (three) days at the latest from the date it becomes aware of it. In this case the order is cancelled, and the total amount paid by the Buyer is refunded in full, without deduction, to the Buyer's bank account/credit card within 3 (three) days at the latest. The Buyer accepts that they cannot claim any additional compensation or contractual penalty from the Seller because of a cancellation resulting from a stock error.",
      },
      { type: "h2", text: "5. RIGHTS AND OBLIGATIONS OF THE PARTIES" },
      {
        type: "p",
        text: "5.1. The Seller's Responsibility: The Seller guarantees to pack the products subject to the agreement with care and attention so that they are not damaged or broken, and to deliver them to the Buyer intact.",
      },
      {
        type: "p",
        text: '5.2. The Buyer\'s Responsibility (Damage Assessment): The Buyer is obliged to inspect the product at the time of delivery. If there is clearly visible damage, breakage or crushing on the product, the Buyer must have the cargo officer draw up a "Damage Assessment Report". Where no report is drawn up, responsibility passes to the Buyer.',
      },
      {
        type: "p",
        text: "5.3. Hidden Damage: In the case of hidden damage/breakage that could not be noticed at delivery but is seen when the package is opened, the Buyer is obliged to notify the Seller in writing (email or support request) of the visual evidence of the damage, such as photos and videos, within 3 days of the delivery date at the latest. If this period is exceeded, the damage is deemed to have occurred after delivery.",
      },
      {
        type: "p",
        text: "5.4. Care in Packing Returns and Exchanges: For return or exchange shipments made under their legal rights, the Buyer is obliged to pack the product carefully in its original box so that it is not damaged or broken, and to deliver it to the Seller intact. Responsibility for products that are damaged or broken in transit and lose their resaleability because of careless packing by the Buyer lies with the Buyer, and returns of such products are not accepted.",
      },
      { type: "h3", text: "5.5. Shipping Fee and Conditions for Exchange Requests:" },
      {
        type: "ul",
        items: [
          "5.5.1. Exchange Conditions: If the Buyer wishes to exchange the product received for another colour, model or type, the exchange process may be started within 30 (thirty) days of the delivery date at the latest, provided that the product is unused and undamaged, its hygienic protective packaging/cellophane wrap has not been opened and it has not lost its resaleability. The final decision and discretion in evaluating, approving and processing exchange requests rests entirely with the Shop (the Seller).",
          "5.5.2. Shipping and Packing Responsibility for Exchanges: The round-trip shipping cost of exchanges approved by the Shop is borne entirely by the Buyer. The Buyer is solely responsible for delivering the product to be exchanged to the Seller complete and intact, together with its original box, invoice and all accessories, packed so that it is not damaged in transit. Exchange requests for products that are damaged or incomplete because of careless packing, or that are sent without the Shop's approval, will not be accepted.",
        ],
      },
      { type: "h2", text: "6. RIGHT OF WITHDRAWAL" },
      {
        type: "p",
        text: "6.1. The Buyer has the right to withdraw from the agreement within 14 (fourteen) days of the date the product is delivered to them or to the person/organisation at the address they indicated, without giving any reason and without paying any penalty.",
      },
      {
        type: "p",
        text: '6.2. To exercise the right of withdrawal, written notice must be given to the Seller within this 14-day period by fax, email or a support/return request on the website, and the product must not have been used, within the framework of the provisions of "7. Products for Which the Right of Withdrawal Cannot Be Exercised".',
      },
      {
        type: "p",
        text: "6.3. The shipping fee for products returned under the right of withdrawal is borne by the Seller. The Buyer is obliged to send the product back only with the contracted cargo company specified by the Seller in the preliminary information form. The shipping fee for returns sent with a different cargo company is covered by the Buyer.",
      },
      {
        type: "p",
        text: "6.4. Presenting the Invoice for Individual Orders: The Buyer is obliged to send the product returned under the right of withdrawal back together with the original invoice (or e-archive invoice) received with it. Under the Tax Procedure Law, so that the accounting procedures can be completed, the explanation section on the invoice, if there is one, must be filled in and signed by the Buyer.",
      },
      {
        type: "p",
        text: '6.5. Return Invoice Requirement for Business Orders: If the invoice for the product to be returned was issued in the name of an organisation/company (Business Invoice), the Buyer must send the product back together with a "RETURN INVOICE" issued by that organisation. Returns of orders invoiced in the name of organisations cannot be completed, and no refund can be made, unless a legal "Return Invoice" is issued.',
      },
      { type: "h2", text: "7. PRODUCTS FOR WHICH THE RIGHT OF WITHDRAWAL CANNOT BE EXERCISED (HYGIENE AND USE EXCEPTION)" },
      {
        type: "p",
        text: "7.1. In accordance with Article 15/1-ç of the Regulation on Distance Contracts, the right of withdrawal cannot be exercised for products whose protective elements, such as packaging, tape, seal or package, have been opened after delivery and whose return is not suitable in terms of health and hygiene.",
      },
      {
        type: "p",
        text: "7.2. Special Provision for Hookah Sets: The hookah sets, hookah bowls, hookah hoses and sipsi pipes sold are products for personal use. For these products to be taken back under the right of withdrawal, it is mandatory that:",
      },
      {
        type: "ul",
        items: [
          "the products have not been used in any way (no water filled in, no tobacco placed, no contact with smoke/charcoal),",
          "the protective packaging, cellophane, tape or seals of any hose, mouthpiece (sipsi) or other accessories have not been opened/broken.",
        ],
      },
      {
        type: "p",
        text: "7.3. Returns of hookah sets and accessories that have come into contact with tobacco or water, even for trial purposes, that are found to have been used, or whose hygienic protective packaging has been opened will strictly not be accepted, in accordance with health and hygiene rules.",
      },
      { type: "h2", text: "8. DISPUTE RESOLUTION AND COMPETENT COURT" },
      {
        type: "p",
        text: "In the application of this Agreement, up to the value announced each year by the Ministry of Trade, the Consumer Arbitration Committees and the Consumer Courts of the place where the Buyer purchased the goods or services or where the Buyer resides are competent.",
      },
      { type: "h2", text: "9. ENTRY INTO FORCE" },
      {
        type: "p",
        text: "When the Buyer completes the order on the website and proceeds to the payment stage, the Buyer is deemed to have declared that they have read and accepted all the terms of this Agreement. Upon approval of the order, the Seller is obliged to send this agreement to the Buyer's durable data medium (email address).",
      },
    ],
  },
];
