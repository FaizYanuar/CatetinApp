# CatetinApp

![Project Status](https://img.shields.io/badge/status-active-black)
![License](https://img.shields.io/badge/license-MIT-blue)

## 📄 Description

**CatetinApp** is a modern personal finance and accounting tracker built to help users manage their income and expenses efficiently. Designed with performance and user experience in mind, it provides a seamless interface for recording transactions and monitoring financial health.

## ✨ Features

* **Transaction Recording:** Easily log income and expenses.
* **Data Persistence:** Robust database management using Drizzle ORM.
* **Responsive Design:** optimized for both desktop and mobile devices.
* **Modern UI:** Clean and accessible interface built with Tailwind CSS.

## 🛠️ Tech Stack

* **Framework:** [Next.js](https://nextjs.org/) (App Router)
* **Language:** TypeScript / JavaScript
* **Database:** PostgreSQL
* **ORM:** [Drizzle ORM](https://orm.drizzle.team/)
* **Styling:** Tailwind CSS
* **UI Components:** shadcn/ui
* **Deployment:** Vercel

## 🚀 Getting Started

Follow these steps to set up the project locally.

### Prerequisites

* Node.js (v18 or higher)
* npm or yarn

### Installation

1.  **Clone the repository**
    ```bash
    git clone [https://github.com/FaizYanuar/CatetinApp.git](https://github.com/FaizYanuar/CatetinApp.git)
    cd CatetinApp
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Environment Setup**
    Create a `.env` file in the root directory and add your database credentials:
    ```bash
    DATABASE_URL=postgres://user:password@host:port/db_name
    ```

4.  **Database Migration**
    Push the schema to your database using Drizzle:
    ```bash
    npx drizzle-kit push
    ```

5.  **Run the development server**
    ```bash
    npm run dev
    ```

    Open [http://localhost:3000](http://localhost:3000) to view the application.

## 🤝 Contributing

Contributions are welcome. Please fork the repository and create a pull request for any feature updates or bug fixes.

## 👤 Author

**Faiz Yanuar**
* GitHub: [@FaizYanuar](https://github.com/FaizYanuar)

## 📝 License

This project is open source and available under the [MIT License](LICENSE).
