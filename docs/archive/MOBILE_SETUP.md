# Setup Applicazione Mobile .NET MAUI

## Prerequisiti

- Visual Studio 2022 (Windows) o Visual Studio for Mac
- .NET 8.0 SDK
- Workload .NET MAUI installato
- Android SDK (per Android)
- Xcode (per iOS, solo su Mac)

## Creazione Progetto

### 1. Crea nuovo progetto .NET MAUI

```bash
dotnet new maui -n SplitExpenses.Mobile -o mobile/SplitExpenses.Mobile
cd mobile/SplitExpenses.Mobile
```

### 2. Installa pacchetti NuGet necessari

```bash
dotnet add package CommunityToolkit.Mvvm
dotnet add package Microsoft.Extensions.Http
dotnet add package System.IdentityModel.Tokens.Jwt
dotnet add package Plugin.GoogleClient
dotnet add package sqlite-net-pcl
dotnet add package FirebaseAdmin
```

### 3. Struttura Cartelle

```
SplitExpenses.Mobile/
├── ViewModels/
│   ├── BaseViewModel.cs
│   ├── LoginViewModel.cs
│   ├── ListsViewModel.cs
│   ├── ExpensesViewModel.cs
│   └── ProfileViewModel.cs
├── Views/
│   ├── LoginPage.xaml
│   ├── MainTabbedPage.xaml
│   ├── ListsPage.xaml
│   ├── ExpensesPage.xaml
│   └── ProfilePage.xaml
├── Services/
│   ├── IApiService.cs
│   ├── ApiService.cs
│   ├── IAuthService.cs
│   ├── AuthService.cs
│   ├── IStorageService.cs
│   ├── StorageService.cs
│   └── ISyncService.cs
├── Models/
│   ├── User.cs
│   ├── List.cs
│   ├── Expense.cs
│   └── Reimbursement.cs
├── Helpers/
│   └── Settings.cs
└── MauiProgram.cs
```

## Configurazione

### 1. MauiProgram.cs

```csharp
using Microsoft.Extensions.Logging;
using CommunityToolkit.Maui;
using SplitExpenses.Mobile.Services;
using SplitExpenses.Mobile.ViewModels;
using SplitExpenses.Mobile.Views;

namespace SplitExpenses.Mobile;

public static class MauiProgram
{
    public static MauiApp CreateMauiApp()
    {
        var builder = MauiApp.CreateBuilder();
        builder
            .UseMauiApp<App>()
            .UseMauiCommunityToolkit()
            .ConfigureFonts(fonts =>
            {
                fonts.AddFont("OpenSans-Regular.ttf", "OpenSansRegular");
                fonts.AddFont("OpenSans-Semibold.ttf", "OpenSansSemibold");
            });

        // Services
        builder.Services.AddSingleton<IApiService, ApiService>();
        builder.Services.AddSingleton<IAuthService, AuthService>();
        builder.Services.AddSingleton<IStorageService, StorageService>();
        builder.Services.AddSingleton<ISyncService, SyncService>();

        // ViewModels
        builder.Services.AddTransient<LoginViewModel>();
        builder.Services.AddTransient<ListsViewModel>();
        builder.Services.AddTransient<ExpensesViewModel>();
        builder.Services.AddTransient<ProfileViewModel>();

        // Views
        builder.Services.AddTransient<LoginPage>();
        builder.Services.AddTransient<MainTabbedPage>();
        builder.Services.AddTransient<ListsPage>();
        builder.Services.AddTransient<ExpensesPage>();
        builder.Services.AddTransient<ProfilePage>();

#if DEBUG
        builder.Logging.AddDebug();
#endif

        return builder.Build();
    }
}
```

### 2. App.xaml.cs

```csharp
namespace SplitExpenses.Mobile;

public partial class App : Application
{
    private readonly IAuthService _authService;

    public App(IAuthService authService)
    {
        InitializeComponent();
        _authService = authService;

        // Check se utente è già autenticato
        if (_authService.IsAuthenticated())
        {
            MainPage = new AppShell();
        }
        else
        {
            MainPage = new NavigationPage(new LoginPage());
        }
    }
}
```

## Configurazione Google Sign-In

### Android (Platforms/Android/AndroidManifest.xml)

```xml
<application>
    <meta-data
        android:name="com.google.android.gms.version"
        android:value="@integer/google_play_services_version" />
</application>
```

### iOS (Platforms/iOS/Info.plist)

```xml
<key>CFBundleURLTypes</key>
<array>
    <dict>
        <key>CFBundleURLSchemes</key>
        <array>
            <string>com.googleusercontent.apps.YOUR_CLIENT_ID</string>
        </array>
    </dict>
</array>
```

## Implementazione Base

### BaseViewModel.cs

```csharp
using CommunityToolkit.Mvvm.ComponentModel;

namespace SplitExpenses.Mobile.ViewModels;

public partial class BaseViewModel : ObservableObject
{
    [ObservableProperty]
    private bool isBusy;

    [ObservableProperty]
    private string title = string.Empty;
}
```

### LoginViewModel.cs

```csharp
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using SplitExpenses.Mobile.Services;

namespace SplitExpenses.Mobile.ViewModels;

public partial class LoginViewModel : BaseViewModel
{
    private readonly IAuthService _authService;

    public LoginViewModel(IAuthService authService)
    {
        _authService = authService;
        Title = "Login";
    }

    [RelayCommand]
    private async Task LoginWithGoogleAsync()
    {
        if (IsBusy)
            return;

        try
        {
            IsBusy = true;

            var result = await _authService.LoginWithGoogleAsync();

            if (result.Success)
            {
                // Navigate to main app
                Application.Current!.MainPage = new AppShell();
            }
            else
            {
                await Shell.Current.DisplayAlert("Error", result.ErrorMessage, "OK");
            }
        }
        catch (Exception ex)
        {
            await Shell.Current.DisplayAlert("Error", ex.Message, "OK");
        }
        finally
        {
            IsBusy = false;
        }
    }
}
```

### LoginPage.xaml

```xml
<?xml version="1.0" encoding="utf-8" ?>
<ContentPage xmlns="http://schemas.microsoft.com/dotnet/2021/maui"
             xmlns:x="http://schemas.microsoft.com/winfx/2009/xaml"
             xmlns:vm="clr-namespace:SplitExpenses.Mobile.ViewModels"
             x:Class="SplitExpenses.Mobile.Views.LoginPage"
             x:DataType="vm:LoginViewModel"
             Shell.NavBarIsVisible="False">

    <Grid RowDefinitions="*,Auto,*" Padding="20">

        <VerticalStackLayout Grid.Row="1" Spacing="20">

            <Label Text="Split Expenses"
                   FontSize="32"
                   FontAttributes="Bold"
                   HorizontalOptions="Center" />

            <Label Text="Gestisci le tue spese condivise in modo semplice"
                   FontSize="16"
                   HorizontalOptions="Center"
                   TextColor="{StaticResource Gray600}" />

            <Button Text="Accedi con Google"
                    Command="{Binding LoginWithGoogleCommand}"
                    IsEnabled="{Binding IsBusy, Converter={StaticResource InvertedBoolConverter}}"
                    HorizontalOptions="Center"
                    Margin="0,40,0,0" />

            <ActivityIndicator IsRunning="{Binding IsBusy}"
                              IsVisible="{Binding IsBusy}"
                              HorizontalOptions="Center" />
        </VerticalStackLayout>
    </Grid>
</ContentPage>
```

### AppShell.xaml

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<Shell xmlns="http://schemas.microsoft.com/dotnet/2021/maui"
       xmlns:x="http://schemas.microsoft.com/winfx/2009/xaml"
       xmlns:local="clr-namespace:SplitExpenses.Mobile.Views"
       x:Class="SplitExpenses.Mobile.AppShell">

    <TabBar>
        <ShellContent Title="Home"
                     Icon="home.png"
                     ContentTemplate="{DataTemplate local:HomePage}" />

        <ShellContent Title="Liste"
                     Icon="list.png"
                     ContentTemplate="{DataTemplate local:ListsPage}" />

        <ShellContent Title="Spese"
                     Icon="expense.png"
                     ContentTemplate="{DataTemplate local:ExpensesPage}" />

        <ShellContent Title="Profilo"
                     Icon="profile.png"
                     ContentTemplate="{DataTemplate local:ProfilePage}" />
    </TabBar>
</Shell>
```

## API Service

### IApiService.cs

```csharp
namespace SplitExpenses.Mobile.Services;

public interface IApiService
{
    Task<T?> GetAsync<T>(string endpoint);
    Task<T?> PostAsync<T>(string endpoint, object data);
    Task<T?> PutAsync<T>(string endpoint, object data);
    Task<bool> DeleteAsync(string endpoint);
}
```

### ApiService.cs

```csharp
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;

namespace SplitExpenses.Mobile.Services;

public class ApiService : IApiService
{
    private readonly HttpClient _httpClient;
    private readonly IAuthService _authService;
    private const string BaseUrl = "http://your-api-url:5000/api";

    public ApiService(IAuthService authService)
    {
        _authService = authService;
        _httpClient = new HttpClient { BaseAddress = new Uri(BaseUrl) };
    }

    private async Task AddAuthHeaderAsync()
    {
        var token = await _authService.GetAccessTokenAsync();
        if (!string.IsNullOrEmpty(token))
        {
            _httpClient.DefaultRequestHeaders.Authorization =
                new AuthenticationHeaderValue("Bearer", token);
        }
    }

    public async Task<T?> GetAsync<T>(string endpoint)
    {
        await AddAuthHeaderAsync();
        var response = await _httpClient.GetAsync(endpoint);
        response.EnsureSuccessStatusCode();
        return await response.Content.ReadFromJsonAsync<T>();
    }

    public async Task<T?> PostAsync<T>(string endpoint, object data)
    {
        await AddAuthHeaderAsync();
        var response = await _httpClient.PostAsJsonAsync(endpoint, data);
        response.EnsureSuccessStatusCode();
        return await response.Content.ReadFromJsonAsync<T>();
    }

    public async Task<T?> PutAsync<T>(string endpoint, object data)
    {
        await AddAuthHeaderAsync();
        var response = await _httpClient.PutAsJsonAsync(endpoint, data);
        response.EnsureSuccessStatusCode();
        return await response.Content.ReadFromJsonAsync<T>();
    }

    public async Task<bool> DeleteAsync(string endpoint)
    {
        await AddAuthHeaderAsync();
        var response = await _httpClient.DeleteAsync(endpoint);
        return response.IsSuccessStatusCode;
    }
}
```

## Storage Offline (SQLite)

### StorageService.cs

```csharp
using SQLite;
using SplitExpenses.Mobile.Models;

namespace SplitExpenses.Mobile.Services;

public interface IStorageService
{
    Task InitializeAsync();
    Task<List<Expense>> GetExpensesAsync();
    Task<int> SaveExpenseAsync(Expense expense);
    Task<int> DeleteExpenseAsync(Expense expense);
}

public class StorageService : IStorageService
{
    private SQLiteAsyncConnection? _database;

    public async Task InitializeAsync()
    {
        if (_database != null)
            return;

        var dbPath = Path.Combine(FileSystem.AppDataDirectory, "splitexpenses.db3");
        _database = new SQLiteAsyncConnection(dbPath);

        await _database.CreateTableAsync<Expense>();
        await _database.CreateTableAsync<SyncQueueItem>();
    }

    public async Task<List<Expense>> GetExpensesAsync()
    {
        await InitializeAsync();
        return await _database!.Table<Expense>().ToListAsync();
    }

    public async Task<int> SaveExpenseAsync(Expense expense)
    {
        await InitializeAsync();

        if (expense.Id != Guid.Empty)
            return await _database!.UpdateAsync(expense);
        else
            return await _database!.InsertAsync(expense);
    }

    public async Task<int> DeleteExpenseAsync(Expense expense)
    {
        await InitializeAsync();
        return await _database!.DeleteAsync(expense);
    }
}
```

## Build e Deploy

### Android

```bash
# Debug
dotnet build -t:Run -f net8.0-android

# Release
dotnet publish -f net8.0-android -c Release
```

APK generato in: `bin/Release/net8.0-android/publish/`

### iOS

```bash
# Simulator
dotnet build -t:Run -f net8.0-ios

# Device (richiede provisioning profile)
dotnet publish -f net8.0-ios -c Release
```

## Testing

### Emulatore Android

1. Apri Android Studio
2. Tools → Device Manager
3. Create Device
4. Avvia emulatore
5. Run app da Visual Studio

### Simulatore iOS (solo Mac)

1. Apri Xcode
2. Window → Devices and Simulators
3. Seleziona simulatore
4. Run app da Visual Studio for Mac

## Debug

### Breakpoint e Logging

```csharp
// In ViewModel o Service
System.Diagnostics.Debug.WriteLine($"User logged in: {user.Email}");
```

### Log Console Android

```bash
adb logcat
```

### Log Console iOS

Visibili direttamente in Visual Studio Output durante debug.

## Note Importanti

1. **Google Client ID**: Serve un Client ID diverso per Android e iOS
2. **Deep Linking**: Configurare URL scheme per inviti WhatsApp
3. **Permissions**: Dichiarare permessi necessari (Internet, Storage, Camera per foto scontrini)
4. **SSL Pinning**: Consigliato per production
5. **Offuscation**: Usare ProGuard (Android) per proteggere codice

## Risorse

- [.NET MAUI Documentation](https://docs.microsoft.com/dotnet/maui/)
- [CommunityToolkit.Mvvm](https://learn.microsoft.com/dotnet/communitytoolkit/mvvm/)
- [Google Sign-In MAUI](https://github.com/CrossGeeks/GoogleClientPlugin)
- [SQLite-net](https://github.com/praeclarum/sqlite-net)
