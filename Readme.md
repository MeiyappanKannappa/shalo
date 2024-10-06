# 🎉 Shalo - Optimize Git Size for Nx Monorepo

#### Inspired by [tiktok sparo](https://github.com/tiktok/sparo) for RushJS

A typical Nx Monorepo folder structure can be complex, especially when the number of applications and their dependencies on shared libraries grows. To address this, **Shalo** leverages Git's shallow clone and sparse checkout functionalities to streamline operations.

![Monorepo Structure](https://github.com/user-attachments/assets/70887c17-fd06-45ac-bf7b-e616db105634)

Educating hundreds of engineers working in a monorepo about which shared packages and components their apps need can be challenging. **Shalo** is a CLI tool built with Node.js designed to simplify this process.

---

## 🚀 Install Shalo on Your Machine

- You can install **Shalo** globally using the following command:

```
npm install -g git+git@github.com:MeiyappanKannappa/shalo.git
```

## Note
`This can be used in your CI Pipelines as well`

## 🛠️ Clone Your Repository

- To clone your repository, run:
```
shalo clone <GITREPO_URL>
```

- Alternatively, you can use:
```
npx shalo clone <GITREPO_URL>
```

## 📦 Install Dependencies in Your Repository

- After cloning, navigate into your repository and install the dependencies:
```
npm install
# or
yarn install
```

## 📥 Checkout Required Apps in the Nx Monorepo

- To checkout only the apps you need, use the following command. Shalo computes the dependencies within Nx and checks out all required dependent apps in the monorepo:
```
shalo checkout -a <NX-APP/NX-PROJECT_NAME>
```

❌ Exclude Dependent Apps
- If necessary, you can exclude specific dependent apps. However, be cautious with this option, as it may break Nx builds or other Nx commands:
```
shalo checkout -a <APP/PROJECT_NAME> -e <NX-EXCLUDED_APP_NAME>
```

## 📂 Checkout Only Folders

- If you need to checkout only specific folders without computing dependencies, you can use:
```
shalo checkout -f <FOLDER_NAME>
```

## ➕ Adding Folders to Sparse Mode
- To add additional folders (like mocks, tools, etc.) to your sparse mode monorepo, run:
```
shalo add -f <FOLDER_NAME>
```

## ➕ Add Apps and Dependencies
- You can also add an Nx app along with its dependencies to the sparse repo using the following command:
```
shalo add -a <NX-APP/NX-PROJECT_NAME>
```

## 🔄 Disable Sparse Checkout
- To exit sparse checkout mode or to disable it and revert to using the Git CLI, execute:
```
shalo clean
```

## 📜 Code of Conduct and Contributing
- For guidelines on how to contribute to this project, please refer to our [Code of Conduct](https://github.com/MeiyappanKannappa/shalo/blob/master/code_of_conduct.md) and [Contributing Guidelines](https://github.com/MeiyappanKannappa/shalo/blob/master/contributing.md)

`
With Shalo, you can streamline your workflow in Nx Monorepos, reducing the complexity of managing multiple apps and their dependencies. If you encounter any issues or have suggestions, please feel free to open an issue or a pull request in the repository.
`

# Happy coding! ✨
