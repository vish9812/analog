# Contribution Guidelines

Thank you for considering contributing to the Analog project! We appreciate your interest in helping to improve the project. Before making any contributions, please take a moment to review the guidelines outlined below.

## How to Contribute

To contribute to Analog, follow these steps:

1. **Fork the Repository**: Fork the Analog repository to your own GitHub account by clicking the "Fork" button at the top right corner of the repository page.

2. **Clone the Repository**: Clone your forked repository to your local machine using Git:

```bash
git clone https://github.com/vish9812/analog.git
```

3. **Install Dependencies**: Navigate to the project directory and install the required dependencies:

```bash
cd analog
task install
```

4. **Make Changes**: Make your desired changes to the codebase. Ensure that your changes follow the project's coding conventions and guidelines.

5. **Test Your Changes**: Test your changes thoroughly to ensure they work as expected. Run existing tests, and add new tests.

6. **Submit a Pull Request**: Go to the GitHub page of your forked repository, switch to the branch containing your changes, and click the "New Pull Request" button. Fill out the pull request template with details about your changes, and submit the pull request.

## Guidelines

When contributing to Analog, please adhere to the following guidelines:

- Follow the coding style and conventions used throughout the project.
- Provide clear and descriptive commit messages.
- Include tests for new functionality or changes whenever possible.
- Ensure that your code is well-documented and includes comments where necessary.
- Respect the opinions and decisions of project maintainers and other contributors.

## Tools Needed for Development

### For CLI Development:

- **[Bun](https://bun.sh/)**: Bun is used for both running the app and managing the npm packages.

### For UI Development:

- **[Solid.js](https://www.solidjs.com/)**: Solid.js is used as the frontend library for UI development.
- **[pnpm](https://pnpm.io/)**: Version >= 8 is required for managing npm packages.
- **[Node.js](https://nodejs.org/en)**: Version >= 20.9.0 is required. Consider using a node package manager like [nvm](https://github.com/nvm-sh/nvm) to manage node versions.
- **[Python](https://www.python.org/)**: Version >= 3 is required to run the compiled app.

### Others:

- **[Typescript](https://www.typescriptlang.org/)**: Typescript is used for both UI and CLI.
- **[Taskfile](https://taskfile.dev/)**: Taskfile is used to automate tasks like installing the npm packages and building the app.

## Running and Testing

To run and test the application, you can use the commands provided in the `package.json` file or `taskfile.yml`.

## Feedback and Assistance

If you need any assistance or have questions about contributing to Analog, feel free to reach out to us via GitHub issues or other communication channels. We welcome your feedback and suggestions for improving the project.

Thank you for your contributions and support in making Analog better for everyone!
