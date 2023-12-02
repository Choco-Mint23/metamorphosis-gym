import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useUserContext } from './UserContext'

function Sidebar() {
  const navigate = useNavigate()
  const { userData, updateUser } = useUserContext()
  
  const areObjectsEqual = (obj1, obj2) => {
    return JSON.stringify(obj1) === JSON.stringify(obj2)
  }

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const token = localStorage.getItem('token')

        if (token) {
          const response = await fetch('http://localhost:3001/user-info', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              Authorization: token,
            },
          })

          if (response.ok) {
            const data = await response.json()
            if (!areObjectsEqual(userData, data)) {
              // Update the user data in the context only if it has changed
              updateUser(data)
            }
          } else {
            console.error('Failed to fetch user information')
          }
        }
      } catch (error) {
        console.error('Error during user information fetch:', error)
      }
    }

    fetchUserInfo()
  }, [updateUser, userData])

  const sidebarLinks = [
    { to: '/OverviewPage', text: 'Overview' },
    { to: '/MembershipPage', text: 'Membership' },
    { to: '/ConsultationPage', text: 'Consultation' },
    { to: '/EmailalertsPage', text: 'Email Alerts' },
    { to: '/SettingsPage', text: 'Settings' },
  ]

  const sidebarIcon = {
    OverviewPage: './images/overviewicon.png',
    MembershipPage: './images/membership.png',
    ConsultationPage: './images/consultation.png',
    EmailalertsPage: './images/emailalert.png',
    SettingsPage: './images/settings.png',
  }

  const handleLogout = async () => {
    try {
      const response = await fetch('http://localhost:3001/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })

      if (response.ok) {
        console.log('Logout successful')
        localStorage.removeItem('token')
        updateUser({}) // Clear the user data in the context
        navigate('/login')
        console.log()
        console.log()
      } else {
        // Logout failed
        console.error('Logout failed')
      }
    } catch (error) {
      console.error('Error during logout:', error)
    }
  }

  return (
    <div className="fixed mx-auto h-full w-52 bg-dark-elixir text-white ">
      <div className="flex flex-col text-center">
        <div className="mb-20 mt-8">
          <img
            src="./images/icon.png"
            alt="profile pic"
            className="ml-14 w-24"
          />
          {userData.name && <h2 className="mt-8">{userData.name}</h2>}
          {userData.role && <h2>{userData.role}</h2>}
        </div>
        <ul>
          {sidebarLinks.map((link, index) => (
            <li
              key={index}
              className="flex cursor-pointer items-center hover:bg-sidebar"
            >
              <img
                src={sidebarIcon[link.to.replace('/', '')]}
                alt={`${link.text} icon`}
                className="mb-4 ml-4 mt-3 h-8 w-8"
              />

              <Link
                to={link.to}
                className="ml-2 text-center"
                activeclassname="active bg-sidebar"
              >
                {link.text}
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <div className=" fixed ml-8 mt-64">
        <button
          className="transition-duration-300 h-12 w-36 transform cursor-pointer rounded-xl bg-orangish text-lg transition-transform hover:scale-110 hover:bg-orange-800"
          onClick={handleLogout}
        >
          <img
            src="./images/log-out.png"
            className="absolute ml-4 h-8 w-8"
            alt="logout icon"
          ></img>
          <p className="ml-8">Log out</p>
        </button>
      </div>
    </div>
  )
}

export default Sidebar
