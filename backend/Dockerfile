FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 80
EXPOSE 443

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["SplitExpenses.Api/SplitExpenses.Api.csproj", "SplitExpenses.Api/"]
RUN dotnet restore "SplitExpenses.Api/SplitExpenses.Api.csproj"
COPY . .
WORKDIR "/src/SplitExpenses.Api"
RUN dotnet build "SplitExpenses.Api.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "SplitExpenses.Api.csproj" -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "SplitExpenses.Api.dll"]
